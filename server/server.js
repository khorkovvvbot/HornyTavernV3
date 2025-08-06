const express = require('express')
const cors = require('cors')
const { pool } = require('./database')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ success: true, time: result.rows[0].now })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const { telegram_id } = req.query
    if (telegram_id) {
      const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id])
      res.json(result.rows[0] || null)
    } else {
      const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC')
      res.json(result.rows)
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/users', async (req, res) => {
  try {
    const { telegram_id, username, first_name, last_name, avatar_url, language } = req.body
    const result = await pool.query(
      'INSERT INTO users (telegram_id, username, first_name, last_name, avatar_url, language) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [telegram_id, username || '', first_name || '', last_name || '', avatar_url || '', language || 'en']
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { username, first_name, last_name, avatar_url } = req.body
    const result = await pool.query(
      'UPDATE users SET username = $1, first_name = $2, last_name = $3, avatar_url = $4 WHERE id = $5 RETURNING *',
      [username, first_name, last_name, avatar_url, id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Games endpoints
app.get('/api/games', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/games', async (req, res) => {
  try {
    const { title, description_en, description_ru, cover_url, download_link, platform, platforms, genres } = req.body
    const result = await pool.query(
      'INSERT INTO games (title, description_en, description_ru, cover_url, download_link, platform, platforms, genres) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [title, description_en, description_ru, cover_url, download_link, platform, platforms, genres]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description_en, description_ru, cover_url, download_link, platform, platforms, genres } = req.body
    const result = await pool.query(
      'UPDATE games SET title = $1, description_en = $2, description_ru = $3, cover_url = $4, download_link = $5, platform = $6, platforms = $7, genres = $8, updated_at = NOW() WHERE id = $9 RETURNING *',
      [title, description_en, description_ru, cover_url, download_link, platform, platforms, genres, id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM games WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reviews endpoints
app.get('/api/reviews', async (req, res) => {
  try {
    const { game_id } = req.query
    const result = await pool.query(
      `SELECT r.*, u.telegram_id, u.username, u.first_name, u.last_name, u.avatar_url 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.game_id = $1 
       ORDER BY r.created_at DESC`,
      [game_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/reviews', async (req, res) => {
  try {
    const { user_id, game_id, rating, comment } = req.body
    const result = await pool.query(
      'INSERT INTO reviews (user_id, game_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, game_id, rating, comment]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body
    const result = await pool.query(
      'UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3 RETURNING *',
      [rating, comment, id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM reviews WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Favorites endpoints
app.get('/api/favorites', async (req, res) => {
  try {
    const { user_id } = req.query
    const result = await pool.query(
      `SELECT f.*, g.* FROM favorites f 
       JOIN games g ON f.game_id = g.id 
       WHERE f.user_id = $1 
       ORDER BY f.created_at DESC`,
      [user_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/favorites', async (req, res) => {
  try {
    const { user_id, game_id } = req.body
    const result = await pool.query(
      'INSERT INTO favorites (user_id, game_id) VALUES ($1, $2) RETURNING *',
      [user_id, game_id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/favorites', async (req, res) => {
  try {
    const { user_id, game_id } = req.query
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND game_id = $2', [user_id, game_id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Genres endpoints
app.get('/api/genres', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genres ORDER BY name')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/genres', async (req, res) => {
  try {
    const { name } = req.body
    const result = await pool.query('INSERT INTO genres (name) VALUES ($1) RETURNING *', [name])
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/genres/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM genres WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Screenshots endpoints
app.get('/api/screenshots', async (req, res) => {
  try {
    const { game_id } = req.query
    const result = await pool.query(
      'SELECT * FROM screenshots WHERE game_id = $1 ORDER BY order_index',
      [game_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Notifications endpoints
app.get('/api/notifications', async (req, res) => {
  try {
    const { user_id } = req.query
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [user_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/notifications', async (req, res) => {
  try {
    const { user_id, type, title, message, game_title, from_user } = req.body
    const result = await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, game_title, from_user) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, type, title, message, game_title, from_user]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { read } = req.body
    const result = await pool.query(
      'UPDATE notifications SET read = $1 WHERE id = $2 RETURNING *',
      [read, id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/notifications', async (req, res) => {
  try {
    const { user_id } = req.query
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [user_id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Game suggestions endpoints
app.get('/api/game-suggestions', async (req, res) => {
  try {
    const { user_id } = req.query
    let query = `
      SELECT gs.*, u.telegram_id, u.username, u.first_name, u.last_name, u.avatar_url 
      FROM game_suggestions gs 
      JOIN users u ON gs.user_id = u.id
    `
    let params = []
    
    if (user_id) {
      query += ' WHERE gs.user_id = $1'
      params = [user_id]
    }
    
    query += ' ORDER BY gs.created_at DESC'
    
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/game-suggestions', async (req, res) => {
  try {
    const { user_id, game_title, description } = req.body
    const result = await pool.query(
      'INSERT INTO game_suggestions (user_id, game_title, description) VALUES ($1, $2, $3) RETURNING *',
      [user_id, game_title, description]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/game-suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, reviewed_by } = req.body
    const result = await pool.query(
      'UPDATE game_suggestions SET status = $1, reviewed_at = NOW(), reviewed_by = $2 WHERE id = $3 RETURNING *',
      [status, reviewed_by, id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Review replies endpoints
app.get('/api/review-replies', async (req, res) => {
  try {
    const { review_id } = req.query
    const result = await pool.query(
      `SELECT rr.*, u.telegram_id, u.username, u.first_name, u.last_name, u.avatar_url 
       FROM review_replies rr 
       JOIN users u ON rr.user_id = u.id 
       WHERE rr.review_id = $1 
       ORDER BY rr.created_at ASC`,
      [review_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/review-replies', async (req, res) => {
  try {
    const { review_id, user_id, comment } = req.body
    const result = await pool.query(
      'INSERT INTO review_replies (review_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
      [review_id, user_id, comment]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/review-replies/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM review_replies WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Review reactions endpoints
app.get('/api/review-reactions', async (req, res) => {
  try {
    const { review_id } = req.query
    const result = await pool.query(
      'SELECT reaction_type, COUNT(*) as count FROM review_reactions WHERE review_id = $1 GROUP BY reaction_type',
      [review_id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/review-reactions', async (req, res) => {
  try {
    const { review_id, user_id, reaction_type } = req.body
    const result = await pool.query(
      'INSERT INTO review_reactions (review_id, user_id, reaction_type) VALUES ($1, $2, $3) ON CONFLICT (review_id, user_id) DO UPDATE SET reaction_type = $3 RETURNING *',
      [review_id, user_id, reaction_type]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/review-reactions', async (req, res) => {
  try {
    const { review_id, user_id } = req.query
    await pool.query('DELETE FROM review_reactions WHERE review_id = $1 AND user_id = $2', [review_id, user_id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})