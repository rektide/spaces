select * from atomcollection;

select * from atomworkspace;

select * from entrycontent;

select * from entrystore;


delete from entrycontent;
delete from entrystore;
alter sequence entrystore_entrystoreid_seq restart 1;
alter sequence entrystore_updatetimestamp_seq restart 1;