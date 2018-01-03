$(function () {
    $('#match-selection').modal();
    var matches;
    var selectedMatch;
    var socket = io();
    $.ajax('http://swingman.hk/leagues-api/matches/').then(function (json) {
        $('#matches').append('<option value="">==== Select Match ====</option>');
        matches = json;
        matches.forEach(function (match, i) {
            if (match.home != null && match.away != null) {
                $('#matches').append('<option value="' + i + '">' + match.booking.date + ' ' + match.booking.time + ' ' + match.home.team.name + ' vs ' + match.away.team.name + '</option>');
            }
        });
    });
    $('#choose-match').click(function () {
        $('#choose-match').prop('disabled', true);
        $('#matches').prop('disabled', true);
        selectedMatch = matches[parseInt($('#matches').val())];
        if (selectedMatch == null) {
            return;
        }
        socket.emit('files', selectedMatch);
    });
    var videos = [];
    var video = $('#video')[0];
    var current = -1;
    socket.on('highlight-progress', function (body) {
        $('#choose-match').text(body.toFixed(2) + '%');
        if (body === 100) {
            socket.emit('highlight', selectedMatch);
        }
    });
    socket.on('files', function (body) {
        $('#match-selection').modal('hide');
        videos = body;
        videos.forEach(function (file, i) {
            $('#table tbody').append("<tr data-video=\"" + i + "\">\n        <td>" + file + "</td>\n        <td>-</td>\n        <td>-</td>\n        <td>-</td>\n      </tr>");
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
    $('#table').on('click', '[data-video]', function () {
        current = parseInt($(this).data('video')) - 1;
        nextPreview();
    });
    $('body').keydown(function (e) {
        if (e.key === "s" || e.key === "S") {
            $('#start').click();
        }
        if (e.key === "e" || e.key === "E") {
            $('#end').click();
        }
        if (e.key === "h" || e.key === "H") {
            $('#hide').click();
        }
    });
    $('#start').click(function () {
        $('[data-video=' + current + '] td:nth-child(2)').text(video.currentTime);
    });
    $('#end').click(function () {
        video.pause();
        $('[data-video=' + current + '] td:nth-child(3)').text(video.currentTime);
        nextPreview();
    });
    $('#hide').click(function () {
        $('[data-video=' + current + '] td:nth-child(4)').text('X');
        nextPreview();
    });
    $('#unhide').click(function () {
        $('[data-video=' + current + '] td:nth-child(4)').text('-');
    });
    $('#submit').click(function () {
        var _this = this;
        var data = [];
        $(this).prop('disabled', true);
        $('[data-video]').each(function () {
            if ($('td:nth-child(4)', this).text() !== 'X') {
                data.push({
                    video: $('td:nth-child(1)', this).text(),
                    start: $('td:nth-child(2)', this).text(),
                    end: $('td:nth-child(3)', this).text()
                });
            }
        });
        $.post('/generate', { data: JSON.stringify(data), title: 'overall', match: selectedMatch }).done(function () {
            $(_this).prop('disabled', false);
            alert('Normal Highlight Done');
        }).fail(function () {
            $(_this).prop('disabled', false);
            alert('Normal Highlight FAILED!!!!!!!!');
        });
    });
    $('#submit_mvp').click(function () {
        var _this = this;
        var data = [];
        $(this).prop('disabled', true);
        $('[data-video]').each(function () {
            if ($('td:nth-child(1)', this).text().indexOf($('[name=mvpteam]').val() + '_' + $('[name=mvp]').val() + '_') >= 0 && $('td:nth-child(4)', this).text() !== 'X') {
                data.push({
                    video: $('td:nth-child(1)', this).text(),
                    start: $('td:nth-child(2)', this).text(),
                    end: $('td:nth-child(3)', this).text()
                });
            }
        });
        $.post('/generate', { data: JSON.stringify(data), title: 'mvp', match: selectedMatch }).done(function () {
            $(_this).prop('disabled', false);
            alert('MVP Highlight Done');
        }).fail(function () {
            $(_this).prop('disabled', false);
            alert('MVP Highlight FAILED!!!!!!!!');
        });
    });
});
