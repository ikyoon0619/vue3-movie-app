exports.handler = async function (event, context){
    return {
        statusCode: 200,
        body: JSON.stringify({
            name: 'Inkyu',
            age: 38,
            email: 'ikyoon0619@gmail.com'
        })
    }
}