const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const auth = require('../../middleware/auth')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const keys = require('../../config/keys')

const User = require('../../models/User')

// @route   GET api/auth
// @desc    Get Auth User
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json(user)
    } catch(err) {
        res.status(500).send('Server error')
    }
})

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post('/', [
    check('email', 'Por favor inclua um email válido')
        .isEmail(),
    check('password', 'Senha é obrigatória')
        .exists()
], async (req, res) => {
    
    // validates request body
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    try {
        // see if user exists
        let user = await User.findOne({ email })

        if(!user) {
            return res.status(400).json({ errors: [{ msg: 'Credenciais inválidas' }] })
        }

        // compare passwords
        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Credenciais inválidas' }] })
        }

        // generates jwt
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            keys.jwtSecret,
            { expiresIn: 3600 },
            (err, token) => {
                if(err) throw err
                res.json({ jwt: token })
            })
    } catch(err) {
        res.status(500).send('Server error')
    }
})

module.exports = router