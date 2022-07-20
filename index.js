// Lambda Function code for Alexa.
// Paste this into your index.js file. 


// Ac2

const Alexa = require("ask-sdk-core");
const https = require("https");

var name_tag = '';
var phone_tag = '';
var email_tag = '';
var answer_tag = '';
var note_tag = '';
var card_code = '';

const invocationName = "paola bom";

// Session Attributes 
//   Alexa will track attributes for you, by default only during the lifespan of your session.
//   The history[] array will track previous request(s), used for contextual Help/Yes/No handling.
//   Set up DynamoDB persistence to have the skill save and reload these attributes between skill sessions.

function getMemoryAttributes() {   const memoryAttributes = {
       "history":[],

        // The remaining attributes will be useful after DynamoDB persistence is configured
       "launchCount":0,
       "lastUseTimestamp":0,

       "lastSpeechOutput":{},
       "nextIntent":[]

       // "favoriteColor":"",
       // "name":"",
       // "namePronounce":"",
       // "email":"",
       // "mobileNumber":"",
       // "city":"",
       // "state":"",
       // "postcode":"",
       // "birthday":"",
       // "bookmark":0,
       // "wishlist":[],
   };
   return memoryAttributes;
};

function slConnect() {
    //Connect to SL and store a SessionID
    sl.Connect(function(error, resp) {
        if (error) {
            console.error("Problemas en la conexion al Service Layer");
            console.error(error);
        } else {
            slSession = resp;
        }
    });
}
function parse_email(email)
{
    var rePattern = new RegExp(/@/);
    var arrMatches = email.match(rePattern);
    if(arrMatches)
    {
        email = email.replace(/ /g, '');
    }else{
        rePattern = new RegExp(/ /g);
        if (email.match(rePattern))
        {
            if (email.match(rePattern).length == 1)
            {
                           email = email.replace(/ /g, '@'); 
            }else{
            for(var i=(email.length-1); i>=0; i--)
            {
                if(email.charAt(i) == " ")
                {
                    email = email.substring(0, i) + '@' + email.substring(i + 1);
                    email = email.replace(/ /g, '');
                    break;
                }
            }
        }
        }
    }
    return email;
}
function clean_date(date)
{
    date = date.replace(/\-/g, '');
    date = date.replace(/\./g, '');
    date = date.replace(/ /g, '');
    date = date.replace(/\:/g, '');
    date = date.replace(/Z/g, '');
    date = date.replace(/T/g, '');
    return date;
    
}
function get_card_code(phone)
{
    var datetime = new Date();
    var date = datetime.toISOString();
    date = clean_date(date);
    date = date.slice(7,);
    date = date+phone;
    date = date.replace(/=/g, '');
    var code = new Buffer(date).toString('base64');
    code = code.slice(0,14);
    return code;
}
function send_request_app(name, phone, email, note, card_code)
{
    var flag_error = 0;
    var CardCode_BP = card_code;
    console.log("Send request app");
    var options = { strictSSL: false, headers: { 'Cookie': slSession.cookie } };
    options.body = {};
    console.log('Estoy Ejecutando  en GetActivity, para obtener correlativo de CardCode');
            //console.log("Nuevo Correlativo", body, "-", CardCode);
    console.log("Generando el Request con nuevo CardCode", CardCode_BP);
    var CardType = "C" || ""
    var FederalTaxID = "XXXXXXXXXXXXX" || ""
                //Se reemplaza por valor del Get del ultimo Business Partner
                //var CardCode = req.body.CardCode || ""
    var CardCode = CardCode_BP || ""
    var CardName = name || ""
    var Phone1 = phone || ""
    var MailAddress = email || ""
    var Notes = note || ""
    var options = { strictSSL: false, headers: { 'Cookie': slSession.cookie } };
    options.body = {
                CardCode: CardCode,
                CardName: CardName,
                CardType: CardType,
                Phone1: Phone1,
                EmailAddress: MailAddress,
                Notes: Notes,
                FederalTaxID: FederalTaxID
    }
    console.log("options", options);
    sl.PostActivity(options, function(error, response, body) {
                if (error) {
                    return 400;
                } else {
                    return 200;
                }
    });
}


/* Load NodeJS Modules */
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var sl = require('./modules/serviceLayer');
var slSession = null;
var output = {};

const maxHistorySize = 20; // remember only latest 20 intents 
slConnect();

// 1. Intent Handlers =============================================

const AMAZON_CancelIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let say = 'Perfecto, nos vemos pronto! ';

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

const AMAZON_HelpIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let intents = getCustomIntents();
        let sampleIntent = randomElement(intents);

        let say = 'Hola muchas gracias por pedir ayuda, para crear un socio de negocio, deberás mencionar crear socio, el skill'; 

        // let previousIntent = getPreviousIntent(sessionAttributes);
        // if (previousIntent && !handlerInput.requestEnvelope.session.new) {
        //     say += 'Your last intent was ' + previousIntent + '. ';
        // }
        // say +=  'te guiará con sencillas preguntas para ir respondiendo pacientemente, si tienes algún error puedes confirmar la información requerida en cada paso'

        say +=  ' te guiará con sencillas preguntas para ir respondiendo pacientemente';

        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo ' + say)
            .getResponse();
    },
};

const AMAZON_StopIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


        let say = 'Perfecto, nos vemos pronto! ';

        return responseBuilder
            .speak(say)
            .withShouldEndSession(true)
            .getResponse();
    },
};

const HelloWorldIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'HelloWorldIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola prueba de funcionalidad. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};


const MessageIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'MessageIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        // delegate to Alexa to collect all the required slots 
        const currentIntent = request.intent; 
        let slotValues = getSlotValues(request.intent.slots); 
        let slotStatus = "";
        if (slotValues.mensaje.heardAs) {
            note_tag = slotValues.mensaje.heardAs;
            slotStatus += ' slot mensaje was heard as ' + slotValues.mensaje.heardAs + '. ';
        } else {
            slotStatus += 'slot mensaje is empty. ';
        }
        let say = "Perfecto, ya puedes usar este Lead en SAP Business One";

        var request_code = send_request_app(name_tag, phone_tag, email_tag, note_tag, card_code);
        if (request_code == 400)
        {
            say = 'Existió un error con el envio de los datos';
            return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
        }
        return responseBuilder
            .speak(say)
            //.reprompt('try again, ' + say)
            .getResponse();
        
        

    },
};


const AddClientIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AddClientIntent' && request.dialogState === 'STARTED';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.count = 4;
        sessionAttributes.legit = 0;
        console.log(sessionAttributes.count);

        // delegate to Alexa to collect all the required slots 
        const currentIntent = request.intent; 
        console.log(request.dialogState);
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        if (request.dialogState && request.dialogState !== 'COMPLETED') {
            return handlerInput.responseBuilder
                .addDelegateDirective(currentIntent)
                .getResponse();

        }
        
        

    },
};


const InProgressAddClientIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AddClientIntent' && request.dialogState === 'IN_PROGRESS';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        // delegate to Alexa to collect all the required slots 
        const currentIntent = request.intent; 
        if (request.dialogState && request.dialogState !== 'COMPLETED') {
            let slotValues = getSlotValues(request.intent.slots); 
            sessionAttributes.count = sessionAttributes.count - 1;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            return handlerInput.responseBuilder
            .addDelegateDirective(currentIntent)
            .getResponse();

        }

        
    },
};

const CompletedAddClientIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AddClientIntent' && request.dialogState === 'COMPLETED';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let say = "Listo, hasta pronto";

        let slotStatus = '';
        let resolvedSlot;
        name_tag = '';
        phone_tag = '';
        note_tag = '';
        answer_tag = '';
        email_tag = '';
        card_code = '';


        let slotValues = getSlotValues(request.intent.slots); 
        // getSlotValues returns .heardAs, .resolved, and .isValidated for each slot, according to request slot status codes ER_SUCCESS_MATCH, ER_SUCCESS_NO_MATCH, or traditional simple request slot without resolutions

        // console.log('***** slotValues: ' +  JSON.stringify(slotValues, null, 2));
        //   SLOT: nombre 
        if (slotValues.nombre.heardAs) {
            name_tag = slotValues.nombre.heardAs.toUpperCase();
            slotStatus += ' slot nombre was heard as ' + slotValues.nombre.heardAs + '. ';
        } else {
            slotStatus += 'slot nombre is empty. ';
        }
      
        //   SLOT: telefono 
        if (slotValues.telefono.heardAs) {
            phone_tag = slotValues.telefono.heardAs;
            slotStatus += ' slot telefono was heard as ' + slotValues.telefono.heardAs + '. ';
        } else {
            slotStatus += 'slot telefono is empty. ';
        }
        //   SLOT: correo 
        if (slotValues.correo.heardAs) {
            email_tag = slotValues.correo.heardAs.toUpperCase();
            slotStatus += ' slot correo was heard as ' + slotValues.correo.heardAs + '. ';
        } else {
            slotStatus += 'slot correo is empty. ';
        }
        //   SLOT: mensaje 
        if (slotValues.answer.heardAs) {
            answer_tag = slotValues.answer.heardAs;
            slotStatus += ' slot mensaje was heard as ' + slotValues.answer.heardAs + '. ';
        } else {
            slotStatus += 'slot mensaje is empty. ';
        }
        console.log("Termino de cargar datos");
        //say += slotStatus;

        email_tag = parse_email(email_tag);
        card_code = get_card_code(phone_tag);

        if(answer_tag == "si" || answer_tag == "por supuesto" || answer_tag == "claro"){
        
        return handlerInput.responseBuilder
                .addDelegateDirective({
                name: 'MessageIntent',
                confirmationStatus: 'NONE',
                slots:{
                    mensaje:{
                        name: 'mensaje',
                        value: "",
                        confirmationStatus: 'NONE'
                    }
                }
             })
            .getResponse();
            
        }
        var request_code = send_request_app(name_tag, phone_tag, email_tag, note_tag, card_code);
        //var request_code = 200;
        if (request_code == 400)
        {
            say = 'Existió un error con el envio de los datos';
            return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
        }
        return responseBuilder
            .speak(say)
            //.reprompt('try again, ' + say)
            .getResponse();
       
    },
};

const AMAZON_MoreIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.MoreIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.MoreIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const AMAZON_NavigateSettingsIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NavigateSettingsIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.NavigateSettingsIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const AMAZON_NextIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NextIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.NextIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const AMAZON_PageUpIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.PageUpIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.PageUpIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const AMAZON_PageDownIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.PageDownIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.PageDownIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const AMAZON_PreviousIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.PreviousIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.PreviousIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const AMAZON_ScrollRightIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.ScrollRightIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.ScrollRightIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const AMAZON_ScrollDownIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.ScrollDownIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.ScrollDownIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const AMAZON_ScrollLeftIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.ScrollLeftIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.ScrollLeftIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const AMAZON_ScrollUpIntent_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.ScrollUpIntent' ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        let say = 'Hola de AMAZON.ScrollUpIntent. ';


        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const LaunchRequest_Handler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;

        let say = 'Hola, soy Club One la asistente digital de Erick Gómez';

        let skillTitle = capitalize(invocationName);

        if (supportsDisplay(handlerInput)) {
            const myImage2 = new Alexa.ImageHelper()
               .addImageInstance(DisplayImg2.url)
               .getImage();

            responseBuilder.addRenderTemplateDirective({
               type : 'BodyTemplate2',
               token : 'string',
               backButton : 'HIDDEN',
               backgroundImage: myImage2,
             });
        }

        return responseBuilder
            .speak(say)
            .reprompt('Intenta de nuevo, ' + say)
            .getResponse();
    },
};

const SessionEndedHandler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler =  {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const request = handlerInput.requestEnvelope.request;

        console.log(`Error handled: ${JSON.stringify(error)}`);
        console.log(`Error handled: ${JSON.stringify(request.error)}`);
        console.log("Hay un error en la aplicacion");
        console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);

        return handlerInput.responseBuilder
            .speak('Disculpe, un error ocurrió. Por favor intente de nuevo')
            .reprompt('Disculpe, un error ocurrió. Por favor intente de nuevo')
            .getResponse();
    }
};


// 2. Constants ===========================================================================

    // Here you can define static data, to be used elsewhere in your code.  For example: 
    //    const myString = "Hello World";
    //    const myArray  = [ "orange", "grape", "strawberry" ];
    //    const myObject = { "city": "Boston",  "state":"Massachusetts" };

const APP_ID = undefined;  // TODO replace with your Skill ID (OPTIONAL).

// 3.  Helper Functions ===================================================================

function capitalize(myString) {

     return myString.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); }) ;
}

 
function randomElement(myArray) { 
    return(myArray[Math.floor(Math.random() * myArray.length)]); 
} 
 
function stripSpeak(str) { 
    return(str.replace('<speak>', '').replace('</speak>', '')); 
} 
 
 
 
 
function getSlotValues(filledSlots) { 
    const slotValues = {}; 
 
    Object.keys(filledSlots).forEach((item) => { 
        const name  = filledSlots[item].name; 
 
        if (filledSlots[item] && 
            filledSlots[item].resolutions && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0] && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status && 
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) { 
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) { 
                case 'ER_SUCCESS_MATCH': 
                    slotValues[name] = { 
                        heardAs: filledSlots[item].value, 
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name, 
                        ERstatus: 'ER_SUCCESS_MATCH' 
                    }; 
                    break; 
                case 'ER_SUCCESS_NO_MATCH': 
                    slotValues[name] = { 
                        heardAs: filledSlots[item].value, 
                        resolved: '', 
                        ERstatus: 'ER_SUCCESS_NO_MATCH' 
                    }; 
                    break; 
                default: 
                    break; 
            } 
        } else { 
            slotValues[name] = { 
                heardAs: filledSlots[item].value, 
                resolved: '', 
                ERstatus: '' 
            }; 
        } 
    }, this); 
 
    return slotValues; 
} 
 
function getExampleSlotValues(intentName, slotName) { 
 
    let examples = []; 
    let slotType = ''; 
    let slotValuesFull = []; 
 
    let intents = model.interactionModel.languageModel.intents; 
    for (let i = 0; i < intents.length; i++) { 
        if (intents[i].name == intentName) { 
            let slots = intents[i].slots; 
            for (let j = 0; j < slots.length; j++) { 
                if (slots[j].name === slotName) { 
                    slotType = slots[j].type; 
 
                } 
            } 
        } 
         
    } 
    let types = model.interactionModel.languageModel.types; 
    for (let i = 0; i < types.length; i++) { 
        if (types[i].name === slotType) { 
            slotValuesFull = types[i].values; 
        } 
    } 
 
 
    examples.push(slotValuesFull[0].name.value); 
    examples.push(slotValuesFull[1].name.value); 
    if (slotValuesFull.length > 2) { 
        examples.push(slotValuesFull[2].name.value); 
    } 
 
 
    return examples; 
} 
 
function sayArray(myData, penultimateWord = 'and') { 
    let result = ''; 
 
    myData.forEach(function(element, index, arr) { 
 
        if (index === 0) { 
            result = element; 
        } else if (index === myData.length - 1) { 
            result += ` ${penultimateWord} ${element}`; 
        } else { 
            result += `, ${element}`; 
        } 
    }); 
    return result; 
} 
function supportsDisplay(handlerInput) // returns true if the skill is running on a device with a display (Echo Show, Echo Spot, etc.) 
{                                      //  Enable your skill for display as shown here: https://alexa.design/enabledisplay 
    const hasDisplay = 
        handlerInput.requestEnvelope.context && 
        handlerInput.requestEnvelope.context.System && 
        handlerInput.requestEnvelope.context.System.device && 
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces && 
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display; 
 
    return hasDisplay; 
} 
 
 
const welcomeCardImg = { 
    smallImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane720_480.png", 
    largeImageUrl: "https://s3.amazonaws.com/skill-images-789/cards/card_plane1200_800.png" 
 
 
}; 
 
const DisplayImg1 = { 
    title: 'Jet Plane', 
    url: 'https://s3.amazonaws.com/skill-images-789/display/plane340_340.png' 
}; 
const DisplayImg2 = { 
    title: 'Emilit', 
    url: 'https://alexabucketemilit.s3.amazonaws.com/bienvenida-echo.jpg' 
 
}; 
 
function getCustomIntents() { 
    const modelIntents = model.interactionModel.languageModel.intents; 
 
    let customIntents = []; 
 
 
    for (let i = 0; i < modelIntents.length; i++) { 
 
        if(modelIntents[i].name.substring(0,7) != "AMAZON." && modelIntents[i].name !== "LaunchRequest" ) { 
            customIntents.push(modelIntents[i]); 
        } 
    } 
    return customIntents; 
} 
 
function getSampleUtterance(intent) { 
 
    return randomElement(intent.samples); 
 
} 
 
function getPreviousIntent(attrs) { 
 
    if (attrs.history && attrs.history.length > 1) { 
        return attrs.history[attrs.history.length - 2].IntentRequest; 
 
    } else { 
        return false; 
    } 
 
} 
 
function getPreviousSpeechOutput(attrs) { 
 
    if (attrs.lastSpeechOutput && attrs.history.length > 1) { 
        return attrs.lastSpeechOutput; 
 
    } else { 
        return false; 
    } 
 
} 
 
function timeDelta(t1, t2) { 
 
    const dt1 = new Date(t1); 
    const dt2 = new Date(t2); 
    const timeSpanMS = dt2.getTime() - dt1.getTime(); 
    const span = { 
        "timeSpanMIN": Math.floor(timeSpanMS / (1000 * 60 )), 
        "timeSpanHR": Math.floor(timeSpanMS / (1000 * 60 * 60)), 
        "timeSpanDAY": Math.floor(timeSpanMS / (1000 * 60 * 60 * 24)), 
        "timeSpanDesc" : "" 
    }; 
 
 
    if (span.timeSpanHR < 2) { 
        span.timeSpanDesc = span.timeSpanMIN + " minutes"; 
    } else if (span.timeSpanDAY < 2) { 
        span.timeSpanDesc = span.timeSpanHR + " hours"; 
    } else { 
        span.timeSpanDesc = span.timeSpanDAY + " days"; 
    } 
 
 
    return span; 
 
} 
 
 
const InitMemoryAttributesInterceptor = { 
    process(handlerInput) { 
        let sessionAttributes = {}; 
        if(handlerInput.requestEnvelope.session['new']) { 
 
            sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
 
            let memoryAttributes = getMemoryAttributes(); 
 
            if(Object.keys(sessionAttributes).length === 0) { 
 
                Object.keys(memoryAttributes).forEach(function(key) {  // initialize all attributes from global list 
 
                    sessionAttributes[key] = memoryAttributes[key]; 
 
                }); 
 
            } 
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
 
        } 
    } 
}; 
 
const RequestHistoryInterceptor = { 
    process(handlerInput) { 
 
        const thisRequest = handlerInput.requestEnvelope.request; 
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
 
        let history = sessionAttributes['history'] || []; 
 
        let IntentRequest = {}; 
        if (thisRequest.type === 'IntentRequest' ) { 
 
            let slots = []; 
 
            IntentRequest = { 
                'IntentRequest' : thisRequest.intent.name 
            }; 
 
            if (thisRequest.intent.slots) { 
 
                for (let slot in thisRequest.intent.slots) { 
                    let slotObj = {}; 
                    slotObj[slot] = thisRequest.intent.slots[slot].value; 
                    slots.push(slotObj); 
                } 
 
                IntentRequest = { 
                    'IntentRequest' : thisRequest.intent.name, 
                    'slots' : slots 
                }; 
 
            } 
 
        } else { 
            IntentRequest = {'IntentRequest' : thisRequest.type}; 
        } 
        if(history.length > maxHistorySize - 1) { 
            history.shift(); 
        } 
        history.push(IntentRequest); 
 
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
    } 
 
}; 
 
 
 
 
const RequestPersistenceInterceptor = { 
    process(handlerInput) { 
 
        if(handlerInput.requestEnvelope.session['new']) { 
 
            return new Promise((resolve, reject) => { 
 
                handlerInput.attributesManager.getPersistentAttributes() 
 
                    .then((sessionAttributes) => { 
                        sessionAttributes = sessionAttributes || {}; 
 
 
                        sessionAttributes['launchCount'] += 1; 
 
                        handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
                        handlerInput.attributesManager.savePersistentAttributes() 
                            .then(() => { 
                                resolve(); 
                            }) 
                            .catch((err) => { 
                                reject(err); 
                            }); 
                    }); 
 
            }); 
 
        } // end session['new'] 
    } 
}; 
 
 
const ResponseRecordSpeechOutputInterceptor = { 
    process(handlerInput, responseOutput) { 
 
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
        let lastSpeechOutput = { 
            "outputSpeech":responseOutput.outputSpeech.ssml, 
            "reprompt":responseOutput.reprompt.outputSpeech.ssml 
        }; 
 
        sessionAttributes['lastSpeechOutput'] = lastSpeechOutput; 
 
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes); 
 
    } 
}; 
 
const ResponsePersistenceInterceptor = { 
    process(handlerInput, responseOutput) { 
 
        const ses = (typeof responseOutput.shouldEndSession == "undefined" ? true : responseOutput.shouldEndSession); 
 
        if(ses || handlerInput.requestEnvelope.request.type == 'SessionEndedRequest') { // skill was stopped or timed out 
 
            let sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
 
            sessionAttributes['lastUseTimestamp'] = new Date(handlerInput.requestEnvelope.request.timestamp).getTime(); 
 
            handlerInput.attributesManager.setPersistentAttributes(sessionAttributes); 
 
            return new Promise((resolve, reject) => { 
                handlerInput.attributesManager.savePersistentAttributes() 
                    .then(() => { 
                        resolve(); 
                    }) 
                    .catch((err) => { 
                        reject(err); 
                    }); 
 
            }); 
 
        } 
 
    } 
}; 
 
 
 
// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        AMAZON_CancelIntent_Handler, 
        AMAZON_HelpIntent_Handler, 
        AMAZON_StopIntent_Handler, 
        AddClientIntent_Handler,
        InProgressAddClientIntent_Handler,
        CompletedAddClientIntent_Handler,
        MessageIntent_Handler,
        LaunchRequest_Handler, 
        SessionEndedHandler
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(InitMemoryAttributesInterceptor)
    .addRequestInterceptors(RequestHistoryInterceptor)

   // .addResponseInterceptors(ResponseRecordSpeechOutputInterceptor)

 // .addRequestInterceptors(RequestPersistenceInterceptor)
 // .addResponseInterceptors(ResponsePersistenceInterceptor)

 // .withTableName("askMemorySkillTable")
 // .withAutoCreateTable(true)

    .lambda();


// End of Skill code -------------------------------------------------------------
// Static Language Model for reference

const model = {
    "interactionModel": {
        "languageModel": {
            "invocationName": "emilit one",
            "intents": [
                {
                    "name": "AMAZON.CancelIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.HelpIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.StopIntent",
                    "samples": []
                },
                {
                    "name": "AddClientIntent",
                    "slots": [
                        {
                            "name": "nombre",
                            "type": "AMAZON.Person",
                            "samples": [
                                "{nombre}"
                            ]
                        },
                        {
                            "name": "telefono",
                            "type": "AMAZON.PhoneNumber",
                            "samples": [
                                "{telefono}"
                            ]
                        },
                        {
                            "name": "correo",
                            "type": "AMAZON.SearchQuery",
                            "samples": [
                                "{correo}"
                            ]
                        },
                        {
                            "name": "answer",
                            "type": "AMAZON.SearchQuery",
                            "samples": [
                                "{answer}"
                            ]
                        }
                    ],
                    "samples": [
                        "Crear socio",
                        "Crear un lead en Emilit",
                        "Crear socio de negocio",
                        "Crear un socio de negocio"
                    ]
                },
                {
                    "name": "MessageIntent",
                    "slots": [
                        {
                            "name": "mensaje",
                            "type": "AMAZON.SearchQuery",
                            "samples": [
                                "{mensaje}"
                            ]
                        }
                    ],
                    "samples": []
                }
            ],
            "types": []
        },
        "dialog": {
            "intents": [
                {
                    "name": "AddClientIntent",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": [
                        {
                            "name": "nombre",
                            "type": "AMAZON.Person",
                            "confirmationRequired": true,
                            "elicitationRequired": true,
                            "prompts": {
                                "confirmation": "Confirm.Slot.331871130824.381308724234",
                                "elicitation": "Elicit.Slot.331871130824.381308724234"
                            }
                        },
                        {
                            "name": "telefono",
                            "type": "AMAZON.PhoneNumber",
                            "confirmationRequired": true,
                            "elicitationRequired": true,
                            "prompts": {
                                "confirmation": "Confirm.Slot.331871130824.694551087497",
                                "elicitation": "Elicit.Slot.331871130824.694551087497"
                            }
                        },
                        {
                            "name": "correo",
                            "type": "AMAZON.SearchQuery",
                            "confirmationRequired": true,
                            "elicitationRequired": true,
                            "prompts": {
                                "confirmation": "Confirm.Slot.598382181586.1477581442411",
                                "elicitation": "Elicit.Slot.295703103024.1008788572780"
                            }
                        },
                        {
                            "name": "answer",
                            "type": "AMAZON.SearchQuery",
                            "confirmationRequired": false,
                            "elicitationRequired": true,
                            "prompts": {
                                "elicitation": "Elicit.Slot.378578098921.1230479760498"
                            },
                            "validations": [
                                {
                                    "type": "isInSet",
                                    "prompt": "Slot.Validation.378578098921.1230479760498.1430499594549",
                                    "values": [
                                        "No",
                                        "Si",
                                        "Claro",
                                        "Por supuesto"
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "MessageIntent",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": [
                        {
                            "name": "mensaje",
                            "type": "AMAZON.SearchQuery",
                            "confirmationRequired": false,
                            "elicitationRequired": true,
                            "prompts": {
                                "elicitation": "Elicit.Slot.392988361695.377379825607"
                            }
                        }
                    ]
                }
            ],
            "delegationStrategy": "SKILL_RESPONSE"
        },
        "prompts": [
            {
                "id": "Elicit.Slot.331871130824.381308724234",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "¿Cuál es el nombre del socio de negocio?"
                    }
                ]
            },
            {
                "id": "Confirm.Slot.331871130824.381308724234",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "¿El nombre del socio de negocio {nombre} es correcto?"
                    }
                ]
            },
            {
                "id": "Elicit.Slot.331871130824.694551087497",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "Ok gracias. Confirmo el nombre del socio de negocio!, ¿Cuál es su teléfono?"
                    }
                ]
            },
            {
                "id": "Confirm.Slot.331871130824.694551087497",
                "variations": [
                    {
                        "type": "SSML",
                        "value": "<speak>Escuche <say-as interpret-as=\"telephone\"> {telefono} </say-as> es correcto?</speak>"
                    }
                ]
            },
            {
                "id": "Elicit.Slot.295703103024.1008788572780",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "Excelente, ¿Me puedes decir su correo?"
                    }
                ]
            },
            {
                "id": "Elicit.Slot.378578098921.1230479760498",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "Gracias. ¿Alguna nota adicional de este socio de negocio?"
                    }
                ]
            },
            {
                "id": "Slot.Validation.378578098921.1230479760498.1430499594549",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "No entiendo su respuesta, ¿Puede repetirla de nuevo?"
                    }
                ]
            },
            {
                "id": "Elicit.Slot.392988361695.377379825607",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "¿Qué quisiera agregar?"
                    }
                ]
            },
            {
                "id": "Confirm.Slot.598382181586.1477581442411",
                "variations": [
                    {
                        "type": "SSML",
                        "value": "<speak>El correo <lang xml:lang='es-US'> {correo} </lang> es correcto?</speak>"
                    }
                ]
            }
        ]
    }
};