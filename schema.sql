CREATE TABLE sessions (
  session_id VARCHAR(128)  NOT NULL,
  expires NUMBER(11) NOT NULL,
  attributes CLOB,
  PRIMARY KEY (session_id)
)
