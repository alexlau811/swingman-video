import xml.etree.ElementTree as ET
import subprocess
from pytimeparse.timeparse import timeparse
from datetime import datetime
from os import listdir
from os.path import isfile, join, splitext, dirname, basename
from pathlib import Path

def getVideoTimes(path):
    videos = [join(path, d, f) for d in listdir(path) for f in listdir(join(path, d)) if isfile(join(path, d, f)) and (splitext(f)[1].lower() == '.mp4' or splitext(f)[1].lower() == '.mts')]
    times = {

    }

    for video in videos:
        print(video)
        contents = subprocess.check_output('mediainfo --output=XML "' + video + '"', shell=True)
        
        start_time = datetime.strptime(basename(path) + ' ' + splitext(basename(video))[0][0:8], '%Y-%m-%d %H-%M-%S')
        end_time = None

        root = ET.fromstring(contents)
        for track in root.iter('track'):
            if track.find('Tagged_date') is not None:
                start_time = datetime.strptime(track.find('Tagged_date').text, '%Z %Y-%m-%d %H:%M:%S')
            if track.find('Duration') is not None:
                end_time = timeparse(track.find('Duration').text)
            if start_time is not None and end_time is not None:
                break
        
        times[video] = (start_time, end_time)
    
    print(times)
    return times