require('dotenv').config();
const mysql = require('mysql2');

var db = {
    // Function to connect to the MySQL DB
    connectDB: () => {
        return new Promise((resolve, reject) => {
            conn = mysql.createConnection({
                host: process.env.INDEXER_DB_HOST,
                user: process.env.INDEXER_DB_USER,
                password: process.env.INDEXER_DB_PWD,
                database: process.env.INDEXER_DB_SCHEMA
            });
    
            conn.connect((err) => {
                if (err) reject(err);
                resolve();
            });
        });
    },
    // Function to close the database
    closeDB: () => {
        return new Promise((resolve, reject) => {
            conn.end(err => {
                if (err) reject(err);
                resolve(); 
            })
        });
    },
    // Generic function to update a table row if it already exists or insert if it does not already exist
    updateOrCreateRow: (table, id_field, id_value, fieldsToUpdate) => {
        return new Promise(async (resolve, reject) => {
            const sql_exists = `SELECT ${id_field} FROM ${table} WHERE ${id_field} = '${id_value}'`;
            conn.query(sql_exists, async (err, result) => {
                let sql;
                if (err) reject(err);
                if (result && result.length > 0) {
                    sql = `UPDATE ${table} SET `
                    Object.keys(fieldsToUpdate).forEach(key => {
                    sql += `\`${key}\` = ${fieldsToUpdate[key]}, `
                    });
                    sql = sql.substring(0, sql.length -2);
                    sql += ` WHERE ${id_field} = '${id_value}'`;
                } else {
                    sql = `INSERT INTO ${table} (`;
                    Object.keys(fieldsToUpdate).forEach(key => {
                        sql += `\`${key}\`, `
                    });
                    sql = sql.substring(0, sql.length -2);
                    sql += `) VALUES (`;
                    Object.keys(fieldsToUpdate).forEach(key => {
                        sql += `${fieldsToUpdate[key]}, `
                    });
                    sql = sql.substring(0, sql.length -2);
                    sql += `)`;
                }
                
                conn.query(sql, async (err, result) => {
                if (err) reject(err);
                });    

                resolve();
            });
        })
    },
    runQuery: (query) => {
        return new Promise(async (resolve, reject) => {
            const sql = query;
            conn.query(sql, async (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        })
    }
};

module.exports = db;




