#!/usr/bin/env python
import os
import sys
import subprocess
from datetime import datetime
from highlighter.videotime import getVideoTimes
from highlighter.scoringlog import getScoringLogs
from math import floor

SHOT_TIME_BEFORE = 15
SHOT_TIME_AFTER = 10

# ADJUST = - 7 * 3600 - 8 # adjusting the shot time. use negative if the output is too late or use positive if too early.
ADJUST = - 55 # adjusting the shot time. use negative if the output is too late or use positive if too early.

DELAY = -ADJUST

videos = getVideoTimes(sys.argv[1])
scoringlogs = getScoringLogs(sys.argv[2])

for id, log in scoringlogs.items():
    for video, timing in videos.items(): 
        delta = (timing[0] - (datetime.fromtimestamp(log['time'] / 1000))).total_seconds() + DELAY
        
        if delta < 0 and timing[1] is not None and abs(delta) <= timing[1]:
            delta = abs(delta)

            start = max(0, delta - SHOT_TIME_BEFORE)
            end = SHOT_TIME_BEFORE + SHOT_TIME_AFTER if start + SHOT_TIME_BEFORE + SHOT_TIME_AFTER <= timing[1] else timing[1] - start

            subprocess.check_output(['ffmpeg',
                        '-i', video,
                        '-ss', '00:{:02d}:{:02d}'.format(floor(start / 60), int(start % 60)),
                        '-t',  '00:{:02d}:{:02d}'.format(floor(end / 60), int(end % 60)),
                        '-vcodec', 'copy',
                        '-acodec', 'copy',
                        '-y', sys.argv[3] + '/' + str(int(log['time']/1000))  + '_' + log['side'] + '_' + str(log['number']) + '.mp4'])

for id, log in scoringlogs.items():
    for video, timing in videos.items(): 
        delta = (timing[0] - (datetime.fromtimestamp(log['time'] / 1000))).total_seconds() + DELAY

        #if delta < 0 and timing[1] is not None and abs(delta) <= timing[1]:
        print(str(int(log['time']/1000))  + '_' + log['side'] + '_' + str(log['number']) + '.mp4', datetime.fromtimestamp(log['time'] / 1000), delta, floor(abs(delta / 60)), int(abs(delta) % 60), video)
