

const { log, biglog, errorlog, colorize } = require("./out");

const model = require('./model');
const Op = model.Operators;
const quizz = model.Quizz;

/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
    log("Commandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
    /*
    model.getAll().forEach((quiz, id) => {
        log(` [${colorize(id, 'magenta')}]:  ${quiz.question}`);
    });
    */
    quizz.findAll().then(record => {
        record.forEach((quiz) => {
            log(` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`);
        })
    }).then(() => {
        rl.prompt();
    });

};


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {

        quizz.findOne({
            where: { id: id }
        })
            .then(record => {
                if (record != null)
                {
                    log(` [${colorize(record.id, 'magenta')}]:  ${record.question} ${colorize('=>', 'magenta')} ${record.answer}`);
                } else {
                    rl.prompt();
                }
                
            })
            .then(() => {
                rl.prompt();
            })
            .catch(err => { log(err) })

    }
    rl.prompt();
};


/**
 * Añade un nuevo quiz al módelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {

    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
            let test = quizz.build({
                question: question,
                answer: answer
            });
            test.save()
                .then(() => {
                    log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                })
                .catch();

        });
    });
};


/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        quizz.destroy({
            where: {
                id: id
            }
        })
            .catch(err => { errorlog(error.message); });
    }
    rl.prompt();
};


/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {

            quizz.findOne({
                where: { id: id }
            })
                .then((q) => {
                    if (q != null) {
                        process.stdout.isTTY && setTimeout(() => { rl.write(q.question) }, 0);
                        rl.question(colorize(' Introduzca una pregunta: ', 'red'),
                            question => {
                                process.stdout.isTTY && setTimeout(() => { rl.write(q.answer) }, 0);

                                rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
                                    // db update
                                    quizz.update(
                                        {
                                            question: question,
                                            answer: answer
                                        }, {
                                            where: { id: id }
                                        })
                                        .then(() => { log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`); rl.prompt(); })
                                });

                            });
                    } else {
                        rl.prompt();
                    }
                })

        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {

        quizz.findOne({
            where: { id: id }
        })

            .then((q) => {
                if (q != null) {
                    rl.question(colorize(`${q.question}? `, 'red'), (answer) => {
                        log('Su repuesta es:');
                        (answer == q.answer) ? biglog('Correcta', 'green') : biglog('Incorrecta', 'red');
                        rl.prompt();
                    });
                } else {
                    rl.prompt();
                }

            })
            .catch(err => { log(err) })

    }
    rl.prompt();
};


/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = rl => {
    const quizzes = quizz.findAll();
    let score = 0;
    quizzes
        .then(quizzes => {
            function play() {
                let aleatorio = Math.floor(Math.random() * quizzes.length);
                if (quizzes.length > 0) {
                    let pregunta = quizzes[aleatorio].question;
                    let respuesta = quizzes[aleatorio].answer;
                    rl.question(colorize(`${pregunta} `, 'red'), (answer) => {
                        if (answer == respuesta) {
                            score = score + 1;
                            log(`CORRECTO - Lleva ${score} acierto(s)`);
                            play();
                        } else {
                            log(`INCORRECTO \n Fin del Examen. Aciertos:`);
                            biglog(score, 'red')
                            rl.prompt();
                        }
                    });
                    /**
                     * Se elimina la preguna del test actual, mas no de la BD
                     * y se usa sort para que el array se ordene de nuevo
                     * así se evita el uso de mas variables y si se repite aleatorio
                     * se genera con nueva pregunta y no un error.
                     */
                    quizzes.splice(aleatorio, 1);
                    quizzes.sort()
                } else {
                    log('No hay nada más que preguntar. \n Fin del examen. Aciertos:');
                    biglog(score, 'magenta')
                    rl.prompt()
                }

            }

            play()
        })



};


/**
 * Muestra los nombres de los autores de la práctica.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autores de la práctica:');
    log('Emmanuel Lucio Urbina', 'green');
    log('Twitter : @emmanuelluur', 'magenta')
    rl.prompt();
};


/**
 * Terminar el programa.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};

