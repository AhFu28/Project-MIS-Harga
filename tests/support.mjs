import {DatabaseSync} from 'node:sqlite';
export class D1 {
 constructor(){this.db=new DatabaseSync(':memory:');this.db.exec('PRAGMA foreign_keys=ON');}
 prepare(sql){const db=this.db;return {sql,args:[],bind(...args){return {...this,args};},async run(){const r=db.prepare(sql).run(...this.args);return {meta:{changes:r.changes}};},async first(){return db.prepare(sql).get(...this.args)??null;},async all(){return {results:db.prepare(sql).all(...this.args)};}};}
 async batch(items){this.db.exec('BEGIN');try{const out=[];for(const i of items){const r=this.db.prepare(i.sql).run(...i.args);out.push({meta:{changes:r.changes}});}this.db.exec('COMMIT');return out;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
