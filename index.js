var requesty = require('requesty');
var Papa = require('papaparse');
var OCL = require('openchemlib');



function get(options) {
    return requesty('https://docs.google.com/spreadsheets/d/1Rvy6OiM291d1GN_cyT6eSw_C3lSuJ1jaR7AJa8hgGsc/export?format=tsv')
        .then(function (res) {
            var parsed=parseTabDelimited(res.data);
            var result=getResult(parsed.result, options);
            return result;
        });
}


function parseTabDelimited(str) {
    var calculateProperties=true;
    var result = Papa.parse(str,{
        header:true,
        dynamicTyping: true
    });

    var fields = result.meta.fields;
    var data = result.data;
    function createObject(val) {
        var obj = {};
        for(var i = 0; i < fields.length; i++) {
            var attribute=fields[i].replace(/\./g,'_').replace(/[\n\r]/g,'');
            if (attribute.toLowerCase()=="smiles") attribute="smiles";
            obj[attribute] = val[fields[i]];
        }
        return obj;
    }

    var result = [];

    for(var i = 0; i < data.length; i++) {
        var obj = createObject(data[i]);
        obj._highlight=["id"+i];
        try {
            var mol = OCL.Molecule.fromSmiles(obj.smiles);
            obj.mol = mol.toMolfile();
            if (calculateProperties) {
                var predictions=mol.getProperties();
                obj.hAcceptor=predictions.getAcceptorCount();
                obj.hDonor=predictions.getDonorCount();
                obj.oclLogP=predictions.getLogP();
                obj.oclLogS=predictions.getLogS();
                obj.oclPSA=predictions.getPolarSurfaceArea();
                obj.oclRotatable=predictions.getRotatableBondCount();
                obj.oclStereoCenter=predictions.getStereoCenterCount();
                var mf=mol.getMolecularFormula();
                obj.mw=mf.getRelativeWeight();
                obj.mf=mf.getFormula();
                obj.em=mf.getAbsoluteWeight();
            }
        } catch(e) {
            continue;
        }
        result.push(obj);
    }

    var fields=[];
    if (result[0]) fields=Object.keys(result[0]);

    fields.push('mol');
    result = {result: result};
    result.fields = fields;
    return result;
}

function getResult(result, options) {
    if (! options || ! options.id) return {
        mimetype:"application/json",
        value: result
    };

    var entry=getEntry(result, options.id);

    if (! options.field) { // we return a JSON with all the information
        return {
            mimetype:"application/json",
            value: entry
        }
    }

    switch (options.field.toLowerCase()) {
        case 'mol':
        case 'molfile':
            return {
                mimetype:"chemical/x-mdl-molfile",
                value: entry.mol
            }
            break;
        case 'smiles':
            return {
                mimetype:"chemical/x-daylight-smiles",
                value: entry.smiles
            }
            break;
        case 'inchi':
            return {
                mimetype:"chemical/x-inchi",
                value: entry.InChI
            }
            break;
        default:
            return {
                mimetype:"application/json",
                value: entry[options.field.toLowerCase()]
            }
            break;
    }
    return {
        mimetype:"application/json",
        value: {}
    }
    // we return a specific field

}

function getEntry(result, OSM) {
    var OSM=OSM.toLowerCase();
    for (var i=0; i<result.length; i++) {
        if (result[i].OSM.toLowerCase()===OSM) {
            return result[i]
        }
    }
    return {}
}

function getAll() {
    return get();
}

function getOne(id) {
    return get({id: id});
}

function getOneField(id, fieldName) {
    return get({id: id, field: fieldName});
}

exports.get = get;
exports.getAll = getAll;
exports.getOne = getOne;
exports.getOneField = getOneField;