"""extractor package init — installs PyMySQL as MySQLdb drop-in."""
import pymysql

# Patch version so Django 6's mysqlclient >= 2.2.1 check passes.
# PyMySQL is API-compatible but reports an older version string.
pymysql.version_info = (2, 2, 5, 'final', 0)
pymysql.install_as_MySQLdb()
