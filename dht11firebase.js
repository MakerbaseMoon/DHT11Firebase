class Firestore {
    constructor(serviceAccount) {
        const admin = require("firebase-admin");

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        this.db     = admin.firestore();
    }

    async checkIdPasswd(ckeckIdPasswdData) {
        let _json;

        try {
            _json = {
                Name:   ckeckIdPasswdData["Name"],
                Id:     ckeckIdPasswdData["Id"],
                Passwd: ckeckIdPasswdData["Passwd"],
            };

            if(_json.Name !== "checkIdPasswd")
                return getReturnData("CHECK_ID_PASSWD", "ERROR", "JSON_NAME_ERROR");
        } catch(e) {
            return getReturnData("CHECK_ID_PASSWD", "ERROR", "JSON_ERROR");
        }

        try {
            const snapshot  = await this.db.collection('Users').where('Id', '==', _json.Id).where('Passwd', '==', _json.Passwd).get();

            if(snapshot.empty)
                return getReturnData("CHECK_ID_PASSWD", "ERROR", "ID_OR_PASSWD_ERROR");

            let returnData = getReturnData("CHECK_ID_PASSWD", "OK", NaN);
            snapshot.forEach(doc => {
                returnData["Key"] = doc.id;
            });
            return returnData;

        } catch(e) {
            return getReturnData("CHECK_ID_PASSWD", "ERROR", "DATABASE_WHERE_ERROR");
        }
    }

    async getDHT11Data(dateData) {
        let _json;

        try {
            let date  = new Date(dateData["Year"], dateData["Month"], dateData["Day"], dateData["Hour"]);
            _json = {
                Name:   dateData["Name"],
                Date:   date.getTime(),
            }

            if(_json.Name !== "getDHT11Data")
                return getReturnData("GET_TEMP_HUM", "ERROR", "JSON_NAME_ERROR");

        } catch(e) {
            return getReturnData("GET_TEMP_HUM", "ERROR", "JSON_ERROR");
        }

        try {
            const cityRef = this.db.collection("DHT11").doc(_json.Date.toString());
            const doc = await cityRef.get();

            if (!doc.exists)
                return getReturnData("GET_TEMP_HUM", "ERROR", "DATABASE_NOTFOUND_DATA_ERROR");

            
            let data = getReturnData("GET_TEMP_HUM", "OK", NaN);
            data["Data"]    = doc.data()
            return data;
            
        } catch(e) {
            return getReturnData("GET_TEMP_HUM", "ERROR", "DATABASE_GET_DATA_ERROR");
        }

    }

    async setDHT11Data(DHT11Data) {
        let _json;

        try {
            let date  = new Date(DHT11Data["Year"], DHT11Data["Month"], DHT11Data["Day"], DHT11Data["Hour"]);
            _json = {
                Name:   DHT11Data["Name"],
                Date:   date.getTime(),
                Min:    DHT11Data["Min"],
                Temp:   DHT11Data["Temp"],
                Hum:    DHT11Data["Hum"]
            }

            if(_json.Name !== "setDHT11Data")
                return getReturnData("SET_DHT11", "ERROR", "JSON_NAME_ERROR");

        } catch(e) {
            return getReturnData("SET_DHT11", "ERROR", "JSON_ERROR");
        }

        try {
            let firebaseData = {}
            firebaseData[_json.Min.toString()] = {
                Temp: _json.Temp,
                Hum:  _json.Hum,
            };

            const myDoc = this.db.collection("DHT11").doc(_json.Date.toString());
            const doc = await myDoc.get();

            if (!doc.exists) {
                await myDoc.set({Date: _json.Date});
            }

            await myDoc.update(firebaseData);

        } catch(e) {
            return getReturnData("SET_DHT11", "ERROR", "DATABASE_SAVE_DATA_ERROR");
        }

        return getReturnData("SET_DHT11", "OK", NaN);
    }
}

async function setData(db, collectionPath, docPath, data) {
    try {
        const docRef = db.collection(collectionPath).doc(docPath);
        await docRef.set(data);
    }catch (e) {
        console.log(`Set data error: ${e}, collectionPath: ${collectionPath}, docPath: ${docPath}, data: ${data}.`)
        return getReturnData("SET_DATA", "ERROR", "SEND_DATA_ERROR");
    }
    return getReturnData("SET_DATA", "OK", NaN);
}

function getReturnData(name, type, error) {
    let returnData = {};

    returnData["Name"]  = name;
    returnData["Type"]  = type;
    returnData["Error"] = error;

    return JSON.parse(JSON.stringify(returnData));
}

module.exports.Firestore = Firestore;