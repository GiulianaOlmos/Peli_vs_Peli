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

function crearCompetencia(req,res){
    var nombreCompetencia = req.body.nombre;
    var generoCompetencia = req.body.genero === '0' ? null : req.body.genero;
    var directorCompetencia = req.body.director === '0' ? null : req.body.director;
    var actorCompetencia = req.body.actor === '0' ? null : req.body.actor;

    if(!nombreCompetencia){
        console.log("El nombre de la competencia no puede ser vacio", error.message);
        return res.status(422).send("Falta definir el nombre de la competencia");
    }

    let queryExisteCompetencia = "SELECT * FROM competencia WHERE nombre LIKE '%" + nombreCompetencia + "%'"; 
    
    connection.query(queryExisteCompetencia, function(error, resultado){
        if(error){
            console.log("Hubo un error en la conexion", error.message);
            return res.status(500).send("Hubo un error en la conexion"); 
        }
        if(resultado.length !== 0){
            console.log("La competencia ya existe");
            return res.status(422).send("La competencia ya existe"); 
        }

        let traerLasPeliculas = 'Select count(*) as cantidad FROM pelicula P left join director_pelicula DP on (P.id = DP.pelicula_id) left join actor_pelicula AP on (P.id = AP.pelicula_id) WHERE true';

        if(generoCompetencia){
            traerLasPeliculas += " AND genero_id = " + generoCompetencia;
        }

        if(directorCompetencia){
            traerLasPeliculas += " AND director_id = " + directorCompetencia;
        }
        
        if(actorCompetencia){
            traerLasPeliculas += " AND actor_id = " + actorCompetencia;
        }

        connection.query(traerLasPeliculas, function(error, resultadoPeliculas){
            if(error){
                console.log("Hubo un error en la conexion", error.message);
                return res.status(500).send("Hubo un error en la conexion"); 
            }
            if(resultadoPeliculas[0].cantidad <= 1){
                console.log("No hay suficientes peliculas para crear esta competencia");
                return res.status(422).send("No hay suficientes peliculas para crear esta competencia."); 
            }
            
            var queryNueva = "INSERT INTO competencia (nombre, genero_id, director_id, actor_id) VALUES ('" + nombreCompetencia + "', " + generoCompetencia + ", " + directorCompetencia + ", " + actorCompetencia + ");";
    
            connection.query(queryNueva, function(error, resultado) {
                if (error) {
                    console.log("Hubo un error al crear la competencia", error.message);
                    return res.status(500).send("Hubo un error al crear la competencia");
                }
                res.send(JSON.stringify(resultado));
            }); 
        })

    })  

}


function eliminarVotos(req,res){
    let idCompetencia = req.params.id;
    let eliminar = "DELETE FROM voto WHERE competencia_id = " + idCompetencia;

    connection.query(eliminar, function(error, resultado, fields) {
        if (error) {
            console.log("Error al eliminar votos", error.message);
            return res.status(500).send(error);
        }
        console.log("Competencia reiniciada id: " + idCompetencia);
        res.send(JSON.stringify(resultado));
    });
}

function crearCompetenciaPorGenero(req,res){
    var pedido = "SELECT * FROM genero"
    connection.query(pedido, function (error, resultado){
        if (error) {
            console.log("Error al cargar géneros", error.message);
            return res.status(500).send(error);
        }
        res.send(JSON.stringify(resultado));
    });
}

function crearCompetenciaPorDirectores(req,res){
    var pedido = "SELECT * FROM director"
    connection.query(pedido, function (error, resultado, fields){
        if (error) {
            console.log("Error al cargar directores", error.message);
            return res.status(500).send(error);
        }
        res.send(JSON.stringify(resultado));
    });
}

function crearCompetenciaPorActores(req,res){
    var pedido = "SELECT * FROM actor"
    connection.query(pedido, function (error, resultado, fields){
        if (error) {
            console.log("Error al cargar actores", error.message);
            return res.status(500).send(error);
        }
        res.send(JSON.stringify(resultado));
    });
}

function obtenerNombre(req, res){
    var nombreCompetencia = req.params.id;
    var query = "SELECT competencia.id, competencia.nombre, genero.nombre genero, director.nombre director, actor.nombre actor FROM competencia LEFT JOIN genero ON genero_id = genero.id LEFT JOIN director ON director_id= director.id LEFT JOIN actor ON actor_id= actor.id WHERE competencia.id = " + nombreCompetencia;
    connection.query(query, function(error, resultado){
        if (error) {
            console.log("Hubo un error en la consulta", error.message);
            return res.status(500).send("Hubo un error en la consulta");
        }

        var response = {
            'id': resultado,
            'nombre': resultado[0].nombre,
            'genero_nombre': resultado[0].genero,
            'actor_nombre': resultado[0].actor,
            'director_nombre': resultado[0].director
        }
        res.send(JSON.stringify(response));
    });
}

function eliminarCompetencia(req, res) {
    var idCompetencia = req.params.idCompetencia;
    var borrar = "DELETE FROM competencia WHERE id =" + idCompetencia;
    
    connection.query(borrar, function (error, resultado){
        if(error){
            console.log("Error al eliminar la competencia", error.message);
            return res.status(500).send("Error al eliminar competencia");
        }
        res.send(JSON.stringify(resultado));
    });
}
           

function editarCompetencia(req,res) {
    var idCompetencia = req.params.id;
    var nuevoNombre = req.body.nombre;
    var queryString = "UPDATE competencia SET nombre = '"+ nuevoNombre +"' WHERE id = "+ idCompetencia +";";
    
    connection.query(queryString,function(error, resultado, fields){
        if(error){
            return res.status(500).send("Error al modificar la competencia")
        }
        if (resultado.length == 0){
            console.log("No se encontro la pelicula buscada con ese id");
            return res.status(404).send("No se encontro ninguna pelicula con ese id");
        } else {
            var response = {
                'id': resultado
            };
        }
        res.send(JSON.stringify(response));
    });
}

module.exports = {
    buscarCompetencias: buscarCompetencias,
    obtenerDosPeliculas: obtenerDosPeliculas,
    guardarVoto: guardarVoto,
    cargarResultados: cargarResultados,
    crearCompetencia: crearCompetencia,
    eliminarVotos: eliminarVotos,
    crearCompetenciaPorGenero: crearCompetenciaPorGenero,
    crearCompetenciaPorDirectores: crearCompetenciaPorDirectores,
    crearCompetenciaPorActores: crearCompetenciaPorActores,
    obtenerNombre: obtenerNombre,
    eliminarCompetencia: eliminarCompetencia,
    editarCompetencia: editarCompetencia
}