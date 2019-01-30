'use strict';

const Model = require('../models/index');
const Users = Model.Users;
const FbToken = Model.FbToken;
const GaToken = Model.GaToken;

const HttpStatus = require('http-status-codes');
const Request = require('request-promise');

const FbAPI = require('../api_handler/facebook-api');

const readAllKeysById = (req, res) => {

    Users.findOne({
            where: {id: req.user.id},
            include: [
                {model: GaToken},
                {model: FbToken}]
        }
    )
        .then(result => {
            let fb = result.dataValues.FbTokens[0];
            let ga = result.dataValues.GaTokens[0];

            if (fb == null && ga == null)
                return res.status(HttpStatus.NO_CONTENT).send({});

            let fb_token = (fb == null) ? null : fb.dataValues.api_key;      // FB Token
            let ga_token = (ga == null) ? null : ga.dataValues.private_key;  // GA Token

            return res.status(HttpStatus.OK).send({
                user_id: req.user.id,
                fb_token: fb_token,
                ga_token: ga_token
            });
        })
        .catch(err => {
            console.error(err);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                error: 'Cannot retrieve user tokens.'
            })
        });
};

const checkExistence = async (req, res) => {
    let joinModel;

    switch(req.params.type){
        case '0': joinModel = FbToken;
            break;
        case '1': joinModel = GaToken;
            break;
        default:
            return res.status(HttpStatus.BAD_REQUEST).send({
                error: true,
                message: 'Cannot find a service of type ' + req.params.type + '.'
            })
    }

    try {
        const key = await Users.findOne({where: {id: req.user.id}, include: [{model: joinModel}]});

        if((key['dataValues']['FbTokens'] && key['dataValues']['FbTokens'].length > 0) ||
            (key['dataValues']['GaTokens'] && key['dataValues']['GaTokens'].length > 0)) {
            return res.status(HttpStatus.OK).send({
                exists: true,
                service: parseInt(req.params.type)
            })
        } else {
            return res.status(HttpStatus.OK).send({
                exists: false,
                service: parseInt(req.params.type)
            });
        }

    } catch (e) {
        console.error(e);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            error: true,
            message: 'An error occurred while checking the existence of a token service.'
        })
    }
};

const permissionGranted = async (req, res) => {
    let scopes;

    try {
        switch (req.params.type) {
            case '0': // Facebook
                scopes = await FbAPI.getScopes();

                break;
            case '1': // Google Analytics
                break;
            case '2': // Instagram
                break;
            case '3': // YouTube
                break;
            default:
                break;
        }

    } catch (err) {

    }
};

const insertKey = (req, res) => {
    const service_id = parseInt(req.body.service_id);

    switch (service_id) {
        case 0: // fb
            return insertFbKey(req, res);
        case 1: // google
            return insertGaData(req, res);
        default:
            console.log('ERROR TOKEN-MANAGER. Unrecognized service type: ' + service_id);
            return res.status(HttpStatus.BAD_REQUEST).send({
                created: false,
                error: 'Unrecognized service type.'
            });
    }
};

const update = (req, res) => {
    const service_id = parseInt(req.body.service_id);
    switch (service_id) {
        case 0: //fb
            return updateFbKey(req, res);
        case 1: //google
            return updateGaData(req, res);
        default:
            return res.status(HttpStatus.BAD_REQUEST).send({
                created: false,
                error: 'Unrecognized service type.'
            });
    }

};

const deleteKey = (req, res) => {
    const service_id = parseInt(req.body.service_id);

    switch (service_id) {
        case 0: //fb
            return deleteFbKey(req, res);
        case 1: //google
            return deleteGaData(req, res);
        default:
            return res.status(HttpStatus.BAD_REQUEST).send({
                created: false,
                error: 'Unrecognized service type.'
            });
    }
};

const insertFbKey = (req, res) => {
    FbToken.findOne({
        where: {
            user_id: req.user.id,
        }
    }).then(async key => {
        if (key !== null) {
            console.log('ERROR TOKEN-MANAGER. Key already exists.');
            return res.status(HttpStatus.BAD_REQUEST).send({
                error: 'Facebook token already exists'
            })
        }
        else {
            // Get the right token by doing the call to /me/accounts
            const token = await getPageToken(req.body.api_key);

            FbToken.create({
                user_id: req.user.id,
                api_key: token
            })
                .then(new_key => {
                    return res.status(HttpStatus.CREATED).send({
                        created: true,
                        api_key: token
                    });
                })
                .catch(err => {
                    console.log('ERROR TOKEN-MANAGER. Cannot insert the row in db. Details below:');
                    console.error(err);
                    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                        created: false,
                        api_key: token,
                        error: 'Cannot insert the key'
                    });
                })
        }
    })
};

const insertGaData = (req, res) => {
    GaToken.findOne({
        where: {
            user_id: req.user.id,
        }
    }).then(key => {
        if (key !== null) {
            return res.status(HttpStatus.BAD_REQUEST).send({
                error: 'Google Analytics access token already exists!'
            });
        }
        else {
            let user_id = req.user.id;
            let private_key = req.body.private_key;

            GaToken.create({
                user_id: user_id,
                private_key: private_key
            })
                .then(new_key => {
                    return res.status(HttpStatus.CREATED).send({
                        created: true,
                        private_key: new_key.private_key
                    });
                })
                .catch(err => {
                    console.error(err);
                    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                        created: false,
                        private_key: private_key,
                        error: 'Cannot add new Google Analytics access token.'
                    });
                })
        }
    })
};

const updateFbKey = (req, res) => {
    FbToken.update({
        api_key: FbToken.api_key
    }, {
        where: {
            user_id: req.user.id
        }
    }).then(up_key => {
        return res.status(HttpStatus.OK).send({
            updated: true,
            api_key: FbToken.api_key
        })
    }).catch(err => {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            updated: false,
            api_key: FbToken.api_key,
            error: 'Cannot update the Facebook key'
        })
    })
};

const updateGaData = (req, res) => {
    GaToken.update({
        client_email: GaToken.client_email,
        private_key: GaToken.private_key
    }, {
        where: {
            user_id: req.user.id
        }
    }).then(up_key => {
        return res.status(HttpStatus.OK).send({
            updated: true,
            client_email: GaToken.client_email,
            private_key: GaToken.private_key
        })
    }).catch(err => {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            updated: false,
            client_email: GaToken.client_email,
            private_key: GaToken.private_key,
            error: 'Cannot update the Google Analytics credentials'
        })
    })
};

const deleteFbKey = (req, res) => {
    FbToken.destroy({
        where: {
            user_id: req.user.id
        }
    }).then(del => {
        return res.status(HttpStatus.OK).send({
            deleted: true,
            message: 'Facebook token deleted successfully'
        })
    }).catch(err => {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            deleted: false,
            error: 'Cannot delete the Facebook key'
        })
    })
};

const deleteGaData = (req, res) => {
    GaToken.destroy({
        where: {
            user_id: req.user.id
        }
    }).then(del => {
        return res.status(HttpStatus.OK).send({
            deleted: true,
            message: 'Google Analytics data deleted successfully'
        })
    }).catch(err => {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            deleted: false,
            error: 'Cannot delete the key'
        })
    })
};

const upsertFbKey = async (user_id, token) => {

    let userFind, result;

    try {
        userFind = await FbToken.findOne({where: {user_id: user_id}});

        // If an occurrence alread exists, then update it, else insert a new row
        if(userFind) {
            result = await FbToken.update({api_key: token}, {where: {user_id: user_id}});
        } else {
            result = await FbToken.create({user_id: user_id, api_key: token});
        }

        return !!result;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const upsertGaKey = async (user_id, token) => {
    let userFind, result;

    try {
        userFind = await GaToken.findOne({where: {user_id: user_id}});

        console.log('user_id: ' + token);
        console.log('tokToAdd: ' + token);

        // If an occurrence alread exists, then update it, else insert a new row
        if(userFind) {
            result = await GaToken.update({private_key: token}, {where: {user_id: user_id}});
        } else {
            result = await GaToken.create({user_id: user_id, private_key: token});
        }

        return !!result;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const getPageToken = async (token) => {
    const options = {
        method: GET,
        uri: 'https://graph.facebook.com/me/accounts',
        qs: {
            access_token: token
        }
    };

    try {
        const response = JSON.parse(await Request(options));
        return response['data'][0]['access_token'];
    } catch (e) {
        console.error(e);
        return null;
    }
}

module.exports = {readAllKeysById, insertKey, update, deleteKey, upsertFbKey, upsertGaKey, checkExistence, permissionGranted};