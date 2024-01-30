const jwt=require('jsonwebtoken')


const verifyToken = (req, res, next) => {
    let token = req.headers['token']
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (!err) {
                req.decoded = decoded
                next()
            } else {
                res.status(400).send({ message: "User not authorized" })
            }
        })
    } else {
        return res.status(403).send({
            message: 'No token provided.'
        });
    }
}

module.exports=verifyToken