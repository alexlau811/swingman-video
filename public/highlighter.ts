$(function () {
  $('#match-selection').modal();

  let matches: Match[];
  let selectedMatch: Match;
  let socket = io();

  $.ajax('http://swingman.hk/leagues-api/matches/').then(function (json: any) {
    $('#matches').append('<option value="">==== Select Match ====</option>');

    matches = json;
    matches.forEach((match: Match, i: number): void => {
      if (match.home != null && match.away != null) {
        $('#matches').append('<option value="' + i + '">' + match.booking.date + ' ' + match.booking.time + ' ' + match.home.team.name + ' vs ' + match.away.team.name + '</option>');
      }
    });
  });

  $('#choose-match').click(function() {
    $('#choose-match').prop('disabled', true);
    $('#matches').prop('disabled', true);

    selectedMatch = matches[parseInt($('#matches').val() as string)];
    if (selectedMatch == null) {
        return;
    }

    socket.emit('files', selectedMatch);
  });

  let videos:string[] = [];
  var video = $('#video')[0];
  var current = -1;

  socket.on('highlight-progress', (body: number) => {
    $('#choose-match').text(body.toFixed(2) + '%');
    if (body === 100) {
      socket.emit('highlight', selectedMatch);
    }
  });

  socket.on('files', (body: string[]) => {
    $('#match-selection').modal('hide');
    videos = body;
    videos.forEach(function (file, i) {
      $('#table tbody').append(`<tr data-video="${i}">
        <td>${file}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
      </tr>`);
    });

    nextPreview();
  });

  function nextPreview() {
    current++;

    if (current >= videos.length) {
      return;
    }

    $('[data-video]').removeClass('current');
    $('[data-video=' + current + ']').addClass('current');
    video.src = videos[current];
  }
  
  $('#table').on('click', '[data-video]', function() {
    current = parseInt($(this).data('video')) - 1;
    nextPreview();
  });

  $('body').keydown(function(e) {
    if (e.key === "s" || e.key === "S") {
      $('#start').click();
    }
    if (e.key === "e" || e.key === "E") {
      $('#end').click();
    }
    if (e.key === "h" || e.key === "H") {
      $('#hide').click();
    }
  })

  $('#start').click(function() {
    $('[data-video=' + current + '] td:nth-child(2)').text(video.currentTime);
  });

  $('#end').click(function() {
    video.pause();
    $('[data-video=' + current + '] td:nth-child(3)').text(video.currentTime);

    nextPreview();
  });

  $('#hide').click(function() {
    $('[data-video=' + current + '] td:nth-child(4)').text('X');
    nextPreview();
  });

  $('#unhide').click(function() {
    $('[data-video=' + current + '] td:nth-child(4)').text('-');
  });

  $('#submit').click(function() {
    var data: any = [];
    $(this).prop('disabled', true);
    $('[data-video]').each(function() {
      if ($('td:nth-child(4)', this).text() !== 'X') {
        data.push({
          video: $('td:nth-child(1)', this).text(),
          start: $('td:nth-child(2)', this).text(),
          end: $('td:nth-child(3)', this).text(),
        });
      }
    })
    $.post('/generate', {data: JSON.stringify(data), title: 'overall', match: selectedMatch}).done(() => {
      $(this).prop('disabled', false);
      alert('Normal Highlight Done');
    }).fail(() => {
      $(this).prop('disabled', false);
      alert('Normal Highlight FAILED!!!!!!!!');
    });
  });

  $('#submit_mvp').click(function() {
    var data: any = [];
    $(this).prop('disabled', true);
    $('[data-video]').each(function() {
      if ($('td:nth-child(1)', this).text().indexOf($('[name=mvpteam]').val() + '_' + $('[name=mvp]').val() + '_') >= 0 && $('td:nth-child(4)', this).text() !== 'X') {
        data.push({
          video: $('td:nth-child(1)', this).text(),
          start: $('td:nth-child(2)', this).text(),
          end: $('td:nth-child(3)', this).text(),
        });
      }
    })
    $.post('/generate', {data: JSON.stringify(data), title: 'mvp', match: selectedMatch}).done(() => {
      $(this).prop('disabled', false);
      alert('MVP Highlight Done');
    }).fail(() => {
      $(this).prop('disabled', false);
      alert('MVP Highlight FAILED!!!!!!!!');
    });
  });
})