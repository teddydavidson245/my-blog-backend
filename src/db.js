import { MongoClient } from "mongodb"; //connects to the db

let db;

async function connectToDb (cb){
    const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  db = client.db('react-blog-db');
cb();
}
export {
    db,
    connectToDb
};