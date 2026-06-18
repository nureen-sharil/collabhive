import pymysql

HOST = 'localhost'
PORT = 3307
USER = 'root'
PASSWORD = ''
DBNAME = 'collab_hive'

conn = pymysql.connect(host=HOST, port=PORT, user=USER, password=PASSWORD, autocommit=True)
cur = conn.cursor()
cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DBNAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
print('Database created or already exists:', DBNAME)
cur.close()
conn.close()
