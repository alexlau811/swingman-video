import * as path from 'path'
import * as fs from 'fs'
import * as _ from 'lodash'
import { queue } from 'async'
import { spawn } from 'child_process'

const mkdirp = require('mkdirp')

const movieInputPath = '/Volumes/TOSHIBA EXT/movies-uncat'
const movieOutputPath = '/Volumes/TOSHIBA EXT/movies-cat'

const walkSync = (d: string): string[] | string => {
    return fs.statSync(d).isDirectory() ?
        _.flatten(fs.readdirSync(d).map((f: string) => walkSync(path.join(d, f)))) : d;
};

const checkDate = queue<string, string>((task, callback) => {
    let exif = spawn('exiftool', [task]);
    let date: string | null = null;
    let time: string | null = null;
    let make: string | null = 'Unknown';
    let output: string = '';

    exif.stdout.on('data', (data) => {
        data = data.toString();
        output += data;

        let matches: RegExpMatchArray | null;
        
        matches = data.match(/(Date\/Time Original|Media Create Date)\s+:\s(.*?)$/m);
        if (matches != null && matches.length >= 3) {
            let dates = matches[2].split(' ');
            if (dates.length == 2) {
                date = dates[0].replace(/:/g, '-');
                time = dates[1].replace(/:/g, '-');
            }
        }

        matches = data.match(/(Make)\s+:\s(.*?)$/m);
        if (matches != null && matches.length >= 3) {
            make = matches[2];
        }
    });

    exif.stderr.on('data', (data) => {
        console.log(data);
    });

    exif.on('close', (code) => {
        if (date !== null && time !== null && make !== null) {
            moveMovie.push({ file: task, date, time, make });
            callback();
        } else {
            callback(output);
        }
    });
}, 3);

checkDate.error = (err) => {
    console.error('Check Date Error');
    console.error(err);
}

const moveMovie = queue<{file: string, date: string, time: string, make: string}, string>(({ file, date, time, make }, callback) => {
    let movieDest = `${movieOutputPath}${path.sep}${date}${path.sep}${make}`;
    let movieFile = `${movieDest}${path.sep}${time}${path.extname(file)}`;
    mkdirp(movieDest, (err: string | undefined) => {
        if (err) {
            return callback(err);
        }

        if (fs.existsSync(movieFile)) {
            return callback(`${movieFile} already exists`);
        }
        fs.rename(file, movieFile, (err) => {
            if (err) {
                return callback(err.message);
            } 

            console.log('Moved ' + file);
            callback();
        });
    });
});

moveMovie.error = (err) => {
    console.error('Move Movie Error');
    console.error(err);
}

let movies: string[] = _.flatten([walkSync(movieInputPath)])
_.forEach(movies, (f) => {
    const ext = path.extname(f).toLowerCase();
    if (ext === '.mts' || ext === '.mp4') {
        checkDate.push(f);
    }
});