/* Service Layer module to interact with B1 Data */
/* Server Configuration and User Credentials set in environment variables */

/* No olvidar registar componente Request */
/* npm install request --save */

module.exports = {
        Connect: function(callback) {
            return (Connect(callback));
        },
        PostActivity: function(options, callback) {
            return (PostActivity(options, callback));
        },
        GetActivity: function(options, callback) {
            return (GetActivity(options, callback));
        }
    }
    //Load Node Modules
var req = require('request') // HTTP Client

//Load Local configuration file
var SLServer = "https://b1marketplace.com:50000/b1s/v2/";

function Connect(callback) {
    var uri = SLServer + "Login"
    var resp = {}

    //B1 Login Credentials
    var data = {
        UserName: "manager",
        Password: "S4p*2022",
        CompanyDB: "2022"
    };
    /*
    var data = {
        UserName: "manager",
        Password: "S4p*2022",
        CompanyDB: "B1H_TEST"
    };
    */

    //Set HTTP Request Options
    options = { uri: uri, body: JSON.stringify(data), strictSSL: false }

    console.log(`Conectarndo al Service layer ubicado en ${uri}`);
    console.log("data", data);
    console.log("options", options);
    //Make Request
    req.post(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            console.log(body)
            console.log(response.statusCode)
            resp.cookie = response.headers['set-cookie']
            resp.SessionId = body.SessionId;

            return callback(null, resp);
        } else {
            console.log('Connection error');
            console.log(response)
            return callback(400, response);
        }
    });

}

function SLPost(options, endpoint, callback) {
    options.uri = SLServer + endpoint
    console.log("Posting " + endpoint + " to " + options.uri)
    req.post(options, function(error, response, body) {
        var status = response.statusCode;

        if ((error === null) && (response.statusCode == 201)) {
            console.log(error, status, "todo bien", body);
            body = JSON.parse(body);
            delete body["odata.metadata"];
            mensaje = `Estimado, ${body.CardName} su solicitud fue creada exitosamente, bajo el numero: ${body.CardCode}`;
            console.log("Mensaje", mensaje);
            //return callback(null, response, body);
            return callback(null, response, mensaje);
        } else {
            body = JSON.parse(body);
            delete body["odata.metadata"];
            console.log(error, status, "Error detectado", body);
            cod_error = body.error.code;
            cod_mensaje = body.error.message.value
            mensaje = `Disculpe, se ha producido un error[${cod_error}] - ${cod_mensaje}`;
            console.log("Codigo Error:", cod_error);
            console.log("mensaje:", mensaje);
            return callback(400, response, mensaje);
        }
    });
}

function PostActivity(options, callback) {

    /* Additional Body logic */

    options.body = JSON.stringify(options.body);

    //Make Request
    SLPost(options, "BusinessPartners", callback)
}

function GetActivity(options, callback) {

    /* Additional Body logic */

    options.body = JSON.stringify(options.body);

    //Make Request
    GTCli(options, "BusinessPartners", callback)
}

function GetActivity(options, callback) {

    /* Additional Body logic */

    options.body = JSON.stringify(options.body);

    //Make Request
    GTCli(options, "BusinessPartners", callback)
}

function GTCli(options, endpoint, callback) {

    msg_getBP = `?$top=1&$select=CardCode,CardName,CardType&$filter=CardType eq 'L'&$orderby=CardCode desc`;

    options.uri = SLServer + endpoint + msg_getBP;

    console.log("Get" + endpoint + " to " + options.uri)
    req.get(options, function(error, response, body) {
        var status = response.statusCode;
        //console.log("estoy realizando el Get");
        if ((error === null) && (response.statusCode == 200)) {
            console.log(error, status, "todo bien en GET", body);
            body = JSON.parse(body);
            delete body["odata.metadata"];
            CardCode = body.value[0].CardCode;
            //dejo en un string solo la parte numerica
            // ejemplo L00014 - correlativo max = 14 y nuevo correlativo = 15
            pos = CardCode.indexOf('0', 0);
            largo_ult = CardCode.length;
            corre = Number(CardCode.substring(pos, largo_ult)) + 1;
            corre2 = corre.toString();
            largo = corre2.length;
            //
            //Rutina para crear el nuevo codigo ejemplo: L000000015
            pos_r = largo_ult - largo;
            var x = 0
            var result = ""
            for (i = 0; i < 10; i++) {
                if (i == 0)
                    result += 'L';
                else {
                    if (i < pos_r)
                        result += '0';
                    else {
                        result += corre2.charAt(x);
                        x++;
                    }
                }
            }
            //---------------------------``
            body.value[0].CardCode = result;
            // body = ' body:{' + `CardCode: "${result}"` + '}';
            //console.log("cardCodeGetCliente:", CardCode, "pos", pos, "Corre1", corre, "corre2:", corre2, "largo", largo);
            //console.log("nuevo correlativo:", result);
            return callback(null, response, body);

        } else {
            body = JSON.parse(body);
            delete body["odata.metadata"];
            console.log(error, status, "Error detectado en GET", body);
            return callback(400, response, body);
        }
        //console.log("=====================");
    });

}