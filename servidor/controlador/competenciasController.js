var connection = require('../lib/database');

function buscarCompetencias(req, res) {
    var sql = "SELECT * FROM competencia";
    connection.query(sql, function(error, resultado) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(404).send("Hubo un error en la consulta");
        }
        res.send(JSON.stringify(resultado));

    });
}

module.exports = {
    buscarCompetencias:buscarCompetencias
}