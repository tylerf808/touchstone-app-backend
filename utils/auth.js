const jwt = require('jsonwebtoken')

module.exports = function(req, res, next) {
    
    const token = req.header("Authorization")

    if(!token){
        return res.status(401).json({msg: 'No token, auth denied'})
    }

    try {
        const decoded = jwt.verify(token, 'secret')
        req.user = decoded.user
        next()
    } catch (error) {
        return res.status(401).json({msg: 'Invalid token'})
    }
}