import couchdb
from .config import COUCHDB_SERVER

server = couchdb.Server(COUCHDB_SERVER)
db = server['matchlogs']