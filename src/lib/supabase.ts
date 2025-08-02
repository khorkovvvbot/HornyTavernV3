import { query, testConnection } from './database'
import type { Database } from './database'

// Create a Supabase-like interface for easier migration
class PostgreSQLClient {
  from(table: string) {
    return new TableQuery(table)
  }
}

class TableQuery {
  private table: string
  private selectFields: string = '*'
  private whereConditions: string[] = []
  private orderByClause: string = ''
  private limitClause: string = ''
  private params: any[] = []
  private paramIndex: number = 1

  constructor(table: string) {
    this.table = table
  }

  select(fields: string = '*') {
    this.selectFields = fields
    return this
  }

  eq(column: string, value: any) {
    this.whereConditions.push(`${column} = $${this.paramIndex}`)
    this.params.push(value)
    this.paramIndex++
    return this
  }

  neq(column: string, value: any) {
    this.whereConditions.push(`${column} != $${this.paramIndex}`)
    this.params.push(value)
    this.paramIndex++
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending === false ? 'DESC' : 'ASC'
    this.orderByClause = `ORDER BY ${column} ${direction}`
    return this
  }

  limit(count: number) {
    this.limitClause = `LIMIT ${count}`
    return this
  }

  async single() {
    const result = await this.execute()
    if (result.error) return result
    
    const data = result.data?.[0] || null
    return { data, error: null }
  }

  async maybeSingle() {
    const result = await this.execute()
    if (result.error) return result
    
    const data = result.data?.[0] || null
    return { data, error: null }
  }

  private buildQuery() {
    let sql = `SELECT ${this.selectFields} FROM ${this.table}`
    
    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`
    }
    
    if (this.orderByClause) {
      sql += ` ${this.orderByClause}`
    }
    
    if (this.limitClause) {
      sql += ` ${this.limitClause}`
    }
    
    return sql
  }

  private async execute() {
    try {
      const sql = this.buildQuery()
      console.log('Executing query:', sql, 'with params:', this.params)
      
      const result = await query(sql, this.params)
      return { data: result.rows, error: null }
    } catch (error) {
      console.error('Database query error:', error)
      return { data: null, error }
    }
  }

  // For INSERT operations
  async insert(data: any | any[]) {
    try {
      const records = Array.isArray(data) ? data : [data]
      const results = []

      for (const record of records) {
        const columns = Object.keys(record)
        const values = Object.values(record)
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ')
        
        const sql = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`
        const result = await query(sql, values)
        results.push(...result.rows)
      }

      return { data: Array.isArray(data) ? results : results[0], error: null }
    } catch (error) {
      console.error('Insert error:', error)
      return { data: null, error }
    }
  }

  // For UPDATE operations
  async update(data: any) {
    try {
      const columns = Object.keys(data)
      const values = Object.values(data)
      const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ')
      
      let sql = `UPDATE ${this.table} SET ${setClause}`
      let allParams = [...values]
      
      if (this.whereConditions.length > 0) {
        // Adjust parameter indices for WHERE conditions
        const adjustedConditions = this.whereConditions.map(condition => {
          return condition.replace(/\$(\d+)/g, (match, num) => {
            return `$${parseInt(num) + values.length}`
          })
        })
        sql += ` WHERE ${adjustedConditions.join(' AND ')}`
        allParams = [...values, ...this.params]
      }
      
      sql += ' RETURNING *'
      
      const result = await query(sql, allParams)
      return { data: result.rows, error: null }
    } catch (error) {
      console.error('Update error:', error)
      return { data: null, error }
    }
  }

  // For DELETE operations
  async delete() {
    try {
      let sql = `DELETE FROM ${this.table}`
      
      if (this.whereConditions.length > 0) {
        sql += ` WHERE ${this.whereConditions.join(' AND ')}`
      }
      
      const result = await query(sql, this.params)
      return { data: null, error: null }
    } catch (error) {
      console.error('Delete error:', error)
      return { data: null, error }
    }
  }

  // For COUNT operations
  async count() {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.table}`
      
      if (this.whereConditions.length > 0) {
        sql += ` WHERE ${this.whereConditions.join(' AND ')}`
      }
      
      const result = await query(sql, this.params)
      return { count: parseInt(result.rows[0].count), error: null }
    } catch (error) {
      console.error('Count error:', error)
      return { count: null, error }
    }
  }
}

// Create the main client instance
export const supabase = new PostgreSQLClient()

// Export types
export type { Database }