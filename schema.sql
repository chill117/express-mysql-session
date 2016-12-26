CREATE TABLE :sessions (
  :sessionid VARCHAR(128)  NOT NULL,
  :expires NUMBER(11) NOT NULL,
  :data CLOB,
  PRIMARY KEY (:sessionid)
);
