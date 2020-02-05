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
};

function obtenerDosPeliculas(req, res) {
    var idCompetencia = req.params.id;
    var queryCompetencia = "SELECT nombre, genero_id, director_id, actor_id FROM competencia WHERE id = " + idCompetencia + ";";
    connection.query(queryCompetencia, function(error, competencia){
        if (error) { 
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }

        var queryPeliculas = "SELECT DISTINCT pelicula.id, poster, titulo, genero_id FROM pelicula LEFT JOIN actor_pelicula ON pelicula.id = actor_pelicula.pelicula_id LEFT JOIN director_pelicula ON pelicula.id = director_pelicula.pelicula_id WHERE 1 = 1";
        var genero = competencia[0].genero_id;
        var actor = competencia[0].actor_id;
        var director = competencia[0].director_id;
        var queryGenero = genero ? ' AND pelicula.genero_id = '  + genero : '';
        var queryActor = actor ? ' AND actor_pelicula.actor_id = ' + actor : '';
        var queryDirector = director ? ' AND director_pelicula.director_id = ' + director : '';
        var randomOrder = ' ORDER BY RAND() LIMIT 2';

        var query = queryPeliculas + queryGenero + queryActor + queryDirector + randomOrder;

        connection.query(query, function(error, peliculas){
            if (error) {
                console.log("Hubo un error en la consulta", error.message);
                return res.status(500).send("Hubo un error en la consulta");
            }

           var response = {
                'peliculas': peliculas,
                'competencia': competencia[0].nombre
            };

            res.send(JSON.stringify(response));
        });
    });
}
function guardarVoto(req, res){
    var idCompetencia= req.params.idCompetencia;
    var idPelicula = req.body.idPelicula;
    var sql = "INSERT INTO voto (competencia_id, pelicula_id) values (" + idCompetencia + ", " + idPelicula + ")";
    
    connection.query(sql, function(error, resultado) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }
        var response = {
            'voto': resultado.insertId,
        };
        res.status(200).send(response);    
    });
}

function cargarResultados(req, res){
    var idCompetencia = req.params.id; 
    var sql = "SELECT * FROM competencia WHERE id = " + idCompetencia;
    
    connection.query(sql, function(error, resultado) {
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }

        if (resultado.length === 0) {
            console.log("No se encontro ninguna competencia con este id");
            return res.status(404).send("No se encontro ninguna competencia con este id");
        }

        var competencia = resultado[0];

        var sql = "SELECT voto.pelicula_id, pelicula.poster, pelicula.titulo, COUNT(pelicula_id) As votos FROM voto INNER JOIN pelicula ON voto.pelicula_id = pelicula.id WHERE voto.competencia_id = " + idCompetencia + " GROUP BY voto.pelicula_id ORDER BY COUNT(pelicula_id) DESC LIMIT 3";

        connection.query(sql, function(error, resultado) {
            if (error) {
                console.log("Hubo un error en la consulta", error.message);
                return res.status(500).send("Hubo un error en la consulta");
            }

            var response = {
                'competencia': competencia.nombre,
                'resultados': resultado
            };
           
            res.send(JSON.stringify(response));    
        });             
    });
}

module.exports = {
    buscarCompetencias: buscarCompetencias,
    obtenerDosPeliculas: obtenerDosPeliculas,
    guardarVoto: guardarVoto,
    cargarResultados: cargarResultados,
}