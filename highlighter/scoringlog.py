from .couchdb import db
from collections import OrderedDict

# get scoring log
def getScoringLogs(match_id):
    results = db.view('matchlogs/matchesById', startkey=[int(match_id)], endkey=[int(match_id), {}], include_docs=True)
    if len(results.rows) <= 0:
        return (None, None)

    matchDoc = results.rows[0].doc

    logs = []
    for m in results.rows:
        logResults = db.view('matchlogs/logsByMatch', startkey=[m.doc.id], endkey=[m.doc.id, {}], include_docs=True)
        for row in logResults:
            logs.append(row.doc)
    logs = sorted(logs, key=lambda x: x['time']) 

    scoringlogs = OrderedDict()

    for log in logs:
        if log['action'] == 'DEL':
            if log['ref'] in scoringlogs:
                dellog = scoringlogs[log['ref']]
                del scoringlogs[log['ref']]
        elif log['action'] == '3PTM' or log['action'] == '2PTM':
            scoringlogs[log.id] = log

    return scoringlogs