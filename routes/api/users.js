const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const keys = require('../../config/keys')

const User = require('../../models/User')

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post('/', [
    check('name', 'Name é obrigatório')
        .not()
        .isEmpty(),
    check('email', 'Por favor inclua um email válido')
        .isEmail(),
    check('password', 'Por favor entre com uma senha de 6 caracteres ou mais')
        .isLength({ min: 6 })
], async (req, res) => {
    
    // validates request body
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body

    try {
        // see if user exists
        let user = await User.findOne({ email })

        if(user) {
            return res.status(400).json({ errors: [{ msg: 'Usuário já registrado' }] })
        }

        // get users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        // create user
        user = new User({
            name,
            email,
            avatar,
            password
        })
    
        // encrypt the password
        const salt = await bcrypt.genSalt(10)

        user.password = await bcrypt.hash(password, salt)

        // saves user
        await user.save()

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
        console.error(err.message)
        res.status(500).send('Server error')
    }
})

module.exports = router