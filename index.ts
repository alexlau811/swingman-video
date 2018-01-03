import * as express from 'express'

const mkdirp = require('mkdirp')
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const app = express();
const http = require('http').Server(app)
const io = require('socket.io')(http);
const spawn = require('child_process').spawn;

const movieOutputPath = '/Volumes/TOSHIBA EXT/movies-cat'
const movieHighlightPath = '/Volumes/TOSHIBA EXT/movies-highlight'
const movieTmpPath = '/Volumes/TOSHIBA EXT/movies-tmp'

app.use(express.static(__dirname + '/public'));
app.use(express.static(movieOutputPath));
app.use(express.static(movieHighlightPath));
app.use(express.static(movieTmpPath));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


function exec(name: string, cmd: string, args: any[], cb: (progress: number) => void) {
  let ex = spawn(cmd, args);
  let progress = 0;

  console.log("=========== " + name + " start ===========");

  ex.stdout.on('data', (data: string | Buffer) => {
    progress += 0.01;
    cb(Math.min(99, progress));
    console.log(data.toString());
  });

  ex.stderr.on('data', (data: string | Buffer) => {
    progress += 0.01;
    cb(Math.min(99, progress));
    console.log(data.toString());
  });

  ex.on('close', (code: number) => {
    cb(100);
    console.log("=========== " + name + " end (" + code + ") ===========");
  });
}

io.on('connection', function (socket: SocketIO.Socket) {
  console.log('a user connected');

  socket.on('highlight', (match: Match) => {
    let tmpPath = `${movieTmpPath}${path.sep}${match.id}`;
    mkdirp(tmpPath, () => {
      exec('Extract highlight', 'sh', [
        __dirname + '/start.sh', `${movieOutputPath}${path.sep}${match.booking.date}`, match.id, tmpPath
      ], (progress) => {
        socket.emit('highlight-progress', progress);
      });
    })
  });

  socket.on('files', (match: Match) => {
    let tmpPath = `${movieTmpPath}${path.sep}${match.id}`;
    let files = fs.readdirSync(tmpPath)
      .filter((file: string) => fs.statSync(path.join(tmpPath, file)).isFile() && path.extname(file) == '.mp4')
      .map((file: string) => path.join(match.id.toString(), file));
    socket.emit('files', files);
  });
});

app.post('/generate', function (req: express.Request, res: express.Response) {
  let tmpPath = `${movieTmpPath}${path.sep}${req.body.match.id}`;
  let timestamp = req.body.title + '-' + Math.floor(Date.now() / 1000);

  var concat = '';
  JSON.parse(req.body.data).forEach((file: { video: string, start: string, end: string }) => {
    concat += 'file ' + path.basename(file.video) + '\n';
    if (file.start !== '-') {
      concat += 'inpoint ' + file.start + '\n';
    }
    if (file.end !== '-') {
      concat += 'outpoint ' + file.end + '\n';
    }
  });

  fs.writeFileSync(tmpPath + '/out-' + timestamp + '.txt', concat);

  const ff = spawn('ffmpeg', ['-y', '-auto_convert', '1', '-f', 'concat', '-i', tmpPath + '/out-' + timestamp + '.txt',
    '-vcodec', 'copy', '-acodec', 'mp3', tmpPath + '/out-' + timestamp + '.mp4']);

  ff.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ff.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  ff.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    res.json({result: true});
  });
})

http.listen(4080, function () {
  console.log('listening on *:4080');
});
