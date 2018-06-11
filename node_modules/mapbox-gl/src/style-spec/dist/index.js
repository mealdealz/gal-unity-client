(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mapboxGlStyleSpecification = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw (f.code="MODULE_NOT_FOUND", f)}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';
module.exports = function (style) {
    var styleIDs = [];
    var sourceIDs = [];
    var compositedSourceLayers = [];

    for (var id in style.sources) {
        var source = style.sources[id];

        if (source.type !== "vector")
            { continue; }

        var match = /^mapbox:\/\/(.*)/.exec(source.url);
        if (!match)
            { continue; }

        styleIDs.push(id);
        sourceIDs.push(match[1]);
    }

    if (styleIDs.length < 2)
        { return style; }

    styleIDs.forEach(function (id) {
        delete style.sources[id];
    });

    var compositeID = sourceIDs.join(",");

    style.sources[compositeID] = {
        "type": "vector",
        "url": ("mapbox://" + compositeID)
    };

    style.layers.forEach(function (layer) {
        if (styleIDs.indexOf(layer.source) >= 0) {
            layer.source = compositeID;

            if ('source-layer' in layer) {
                if (compositedSourceLayers.indexOf(layer['source-layer']) >= 0) {
                    throw new Error('Conflicting source layer names');
                } else {
                    compositedSourceLayers.push(layer['source-layer']);
                }
            }
        }
    });

    return style;
};

},{}],2:[function(_dereq_,module,exports){
'use strict';
var isEqual = _dereq_('lodash.isequal');

var operations = {

    /*
     * { command: 'setStyle', args: [stylesheet] }
     */
    setStyle: 'setStyle',

    /*
     * { command: 'addLayer', args: [layer, 'beforeLayerId'] }
     */
    addLayer: 'addLayer',

    /*
     * { command: 'removeLayer', args: ['layerId'] }
     */
    removeLayer: 'removeLayer',

    /*
     * { command: 'setPaintProperty', args: ['layerId', 'prop', value] }
     */
    setPaintProperty: 'setPaintProperty',

    /*
     * { command: 'setLayoutProperty', args: ['layerId', 'prop', value] }
     */
    setLayoutProperty: 'setLayoutProperty',

    /*
     * { command: 'setFilter', args: ['layerId', filter] }
     */
    setFilter: 'setFilter',

    /*
     * { command: 'addSource', args: ['sourceId', source] }
     */
    addSource: 'addSource',

    /*
     * { command: 'removeSource', args: ['sourceId'] }
     */
    removeSource: 'removeSource',

    /*
     * { command: 'setGeoJSONSourceData', args: ['sourceId', data] }
     */
    setGeoJSONSourceData: 'setGeoJSONSourceData',

    /*
     * { command: 'setLayerZoomRange', args: ['layerId', 0, 22] }
     */
    setLayerZoomRange: 'setLayerZoomRange',

    /*
     * { command: 'setLayerProperty', args: ['layerId', 'prop', value] }
     */
    setLayerProperty: 'setLayerProperty',

    /*
     * { command: 'setCenter', args: [[lon, lat]] }
     */
    setCenter: 'setCenter',

    /*
     * { command: 'setZoom', args: [zoom] }
     */
    setZoom: 'setZoom',

    /*
     * { command: 'setBearing', args: [bearing] }
     */
    setBearing: 'setBearing',

    /*
     * { command: 'setPitch', args: [pitch] }
     */
    setPitch: 'setPitch',

    /*
     * { command: 'setSprite', args: ['spriteUrl'] }
     */
    setSprite: 'setSprite',

    /*
     * { command: 'setGlyphs', args: ['glyphsUrl'] }
     */
    setGlyphs: 'setGlyphs',

    /*
     * { command: 'setTransition', args: [transition] }
     */
    setTransition: 'setTransition',

    /*
     * { command: 'setLighting', args: [lightProperties] }
     */
    setLight: 'setLight'

};


function diffSources(before, after, commands, sourcesRemoved) {
    before = before || {};
    after = after || {};

    var sourceId;

    // look for sources to remove
    for (sourceId in before) {
        if (!before.hasOwnProperty(sourceId)) { continue; }
        if (!after.hasOwnProperty(sourceId)) {
            commands.push({ command: operations.removeSource, args: [sourceId] });
            sourcesRemoved[sourceId] = true;
        }
    }

    // look for sources to add/update
    for (sourceId in after) {
        if (!after.hasOwnProperty(sourceId)) { continue; }
        if (!before.hasOwnProperty(sourceId)) {
            commands.push({ command: operations.addSource, args: [sourceId, after[sourceId]] });
        } else if (!isEqual(before[sourceId], after[sourceId])) {
            if (before[sourceId].type === 'geojson' && after[sourceId].type === 'geojson') {
                // geojson sources use setGeoJSONSourceData command to update
                commands.push({ command: operations.setGeoJSONSourceData, args: [sourceId, after[sourceId].data] });
            } else {
                // no update command, must remove then add
                commands.push({ command: operations.removeSource, args: [sourceId] });
                commands.push({ command: operations.addSource, args: [sourceId, after[sourceId]] });
                sourcesRemoved[sourceId] = true;
            }
        }
    }
}

function diffLayerPropertyChanges(before, after, commands, layerId, klass, command) {
    before = before || {};
    after = after || {};

    var prop;

    for (prop in before) {
        if (!before.hasOwnProperty(prop)) { continue; }
        if (!isEqual(before[prop], after[prop])) {
            commands.push({ command: command, args: [layerId, prop, after[prop], klass] });
        }
    }
    for (prop in after) {
        if (!after.hasOwnProperty(prop) || before.hasOwnProperty(prop)) { continue; }
        if (!isEqual(before[prop], after[prop])) {
            commands.push({ command: command, args: [layerId, prop, after[prop], klass] });
        }
    }
}

function pluckId(layer) {
    return layer.id;
}
function indexById(group, layer) {
    group[layer.id] = layer;
    return group;
}

function diffLayers(before, after, commands) {
    before = before || [];
    after = after || [];

    // order of layers by id
    var beforeOrder = before.map(pluckId);
    var afterOrder = after.map(pluckId);

    // index of layer by id
    var beforeIndex = before.reduce(indexById, {});
    var afterIndex = after.reduce(indexById, {});

    // track order of layers as if they have been mutated
    var tracker = beforeOrder.slice();

    // layers that have been added do not need to be diffed
    var clean = Object.create(null);

    var i, d, layerId, beforeLayer, afterLayer, insertBeforeLayerId, prop;

    // remove layers
    for (i = 0, d = 0; i < beforeOrder.length; i++) {
        layerId = beforeOrder[i];
        if (!afterIndex.hasOwnProperty(layerId)) {
            commands.push({ command: operations.removeLayer, args: [layerId] });
            tracker.splice(tracker.indexOf(layerId, d), 1);
        } else {
            // limit where in tracker we need to look for a match
            d++;
        }
    }

    // add/reorder layers
    for (i = 0, d = 0; i < afterOrder.length; i++) {
        // work backwards as insert is before an existing layer
        layerId = afterOrder[afterOrder.length - 1 - i];

        if (tracker[tracker.length - 1 - i] === layerId) { continue; }

        if (beforeIndex.hasOwnProperty(layerId)) {
            // remove the layer before we insert at the correct position
            commands.push({ command: operations.removeLayer, args: [layerId] });
            tracker.splice(tracker.lastIndexOf(layerId, tracker.length - d), 1);
        } else {
            // limit where in tracker we need to look for a match
            d++;
        }

        // add layer at correct position
        insertBeforeLayerId = tracker[tracker.length - i];
        commands.push({ command: operations.addLayer, args: [afterIndex[layerId], insertBeforeLayerId] });
        tracker.splice(tracker.length - i, 0, layerId);
        clean[layerId] = true;
    }

    // update layers
    for (i = 0; i < afterOrder.length; i++) {
        layerId = afterOrder[i];
        beforeLayer = beforeIndex[layerId];
        afterLayer = afterIndex[layerId];

        // no need to update if previously added (new or moved)
        if (clean[layerId] || isEqual(beforeLayer, afterLayer)) { continue; }

        // If source, source-layer, or type have changes, then remove the layer
        // and add it back 'from scratch'.
        if (!isEqual(beforeLayer.source, afterLayer.source) || !isEqual(beforeLayer['source-layer'], afterLayer['source-layer']) || !isEqual(beforeLayer.type, afterLayer.type)) {
            commands.push({ command: operations.removeLayer, args: [layerId] });
            // we add the layer back at the same position it was already in, so
            // there's no need to update the `tracker`
            insertBeforeLayerId = tracker[tracker.lastIndexOf(layerId) + 1];
            commands.push({ command: operations.addLayer, args: [afterLayer, insertBeforeLayerId] });
            continue;
        }

        // layout, paint, filter, minzoom, maxzoom
        diffLayerPropertyChanges(beforeLayer.layout, afterLayer.layout, commands, layerId, null, operations.setLayoutProperty);
        diffLayerPropertyChanges(beforeLayer.paint, afterLayer.paint, commands, layerId, null, operations.setPaintProperty);
        if (!isEqual(beforeLayer.filter, afterLayer.filter)) {
            commands.push({ command: operations.setFilter, args: [layerId, afterLayer.filter] });
        }
        if (!isEqual(beforeLayer.minzoom, afterLayer.minzoom) || !isEqual(beforeLayer.maxzoom, afterLayer.maxzoom)) {
            commands.push({ command: operations.setLayerZoomRange, args: [layerId, afterLayer.minzoom, afterLayer.maxzoom] });
        }

        // handle all other layer props, including paint.*
        for (prop in beforeLayer) {
            if (!beforeLayer.hasOwnProperty(prop)) { continue; }
            if (prop === 'layout' || prop === 'paint' || prop === 'filter' ||
                prop === 'metadata' || prop === 'minzoom' || prop === 'maxzoom') { continue; }
            if (prop.indexOf('paint.') === 0) {
                diffLayerPropertyChanges(beforeLayer[prop], afterLayer[prop], commands, layerId, prop.slice(6), operations.setPaintProperty);
            } else if (!isEqual(beforeLayer[prop], afterLayer[prop])) {
                commands.push({ command: operations.setLayerProperty, args: [layerId, prop, afterLayer[prop]] });
            }
        }
        for (prop in afterLayer) {
            if (!afterLayer.hasOwnProperty(prop) || beforeLayer.hasOwnProperty(prop)) { continue; }
            if (prop === 'layout' || prop === 'paint' || prop === 'filter' ||
                prop === 'metadata' || prop === 'minzoom' || prop === 'maxzoom') { continue; }
            if (prop.indexOf('paint.') === 0) {
                diffLayerPropertyChanges(beforeLayer[prop], afterLayer[prop], commands, layerId, prop.slice(6), operations.setPaintProperty);
            } else if (!isEqual(beforeLayer[prop], afterLayer[prop])) {
                commands.push({ command: operations.setLayerProperty, args: [layerId, prop, afterLayer[prop]] });
            }
        }
    }
}

/**
 * Diff two stylesheet
 *
 * Creates semanticly aware diffs that can easily be applied at runtime.
 * Operations produced by the diff closely resemble the mapbox-gl-js API. Any
 * error creating the diff will fall back to the 'setStyle' operation.
 *
 * Example diff:
 * [
 *     { command: 'setConstant', args: ['@water', '#0000FF'] },
 *     { command: 'setPaintProperty', args: ['background', 'background-color', 'black'] }
 * ]
 *
 * @private
 * @param {*} [before] stylesheet to compare from
 * @param {*} after stylesheet to compare to
 * @returns Array list of changes
 */
function diffStyles(before, after) {
    if (!before) { return [{ command: operations.setStyle, args: [after] }]; }

    var commands = [];

    try {
        // Handle changes to top-level properties
        if (!isEqual(before.version, after.version)) {
            return [{ command: operations.setStyle, args: [after] }];
        }
        if (!isEqual(before.center, after.center)) {
            commands.push({ command: operations.setCenter, args: [after.center] });
        }
        if (!isEqual(before.zoom, after.zoom)) {
            commands.push({ command: operations.setZoom, args: [after.zoom] });
        }
        if (!isEqual(before.bearing, after.bearing)) {
            commands.push({ command: operations.setBearing, args: [after.bearing] });
        }
        if (!isEqual(before.pitch, after.pitch)) {
            commands.push({ command: operations.setPitch, args: [after.pitch] });
        }
        if (!isEqual(before.sprite, after.sprite)) {
            commands.push({ command: operations.setSprite, args: [after.sprite] });
        }
        if (!isEqual(before.glyphs, after.glyphs)) {
            commands.push({ command: operations.setGlyphs, args: [after.glyphs] });
        }
        if (!isEqual(before.transition, after.transition)) {
            commands.push({ command: operations.setTransition, args: [after.transition] });
        }
        if (!isEqual(before.light, after.light)) {
            commands.push({ command: operations.setLight, args: [after.light] });
        }

        // Handle changes to `sources`
        // If a source is to be removed, we also--before the removeSource
        // command--need to remove all the style layers that depend on it.
        var sourcesRemoved = {};

        // First collect the {add,remove}Source commands
        var removeOrAddSourceCommands = [];
        diffSources(before.sources, after.sources, removeOrAddSourceCommands, sourcesRemoved);

        // Push a removeLayer command for each style layer that depends on a
        // source that's being removed.
        // Also, exclude any such layers them from the input to `diffLayers`
        // below, so that diffLayers produces the appropriate `addLayers`
        // command
        var beforeLayers = [];
        if (before.layers) {
            before.layers.forEach(function (layer) {
                if (sourcesRemoved[layer.source]) {
                    commands.push({ command: operations.removeLayer, args: [layer.id] });
                } else {
                    beforeLayers.push(layer);
                }
            });
        }
        commands = commands.concat(removeOrAddSourceCommands);

        // Handle changes to `layers`
        diffLayers(beforeLayers, after.layers, commands);

    } catch (e) {
        // fall back to setStyle
        console.warn('Unable to compute style diff:', e);
        commands = [{ command: operations.setStyle, args: [after] }];
    }

    return commands;
}

module.exports = diffStyles;
module.exports.operations = operations;

},{"lodash.isequal":undefined}],3:[function(_dereq_,module,exports){
'use strict';
function ParsingError(error) {
    this.error = error;
    this.message = error.message;
    var match = error.message.match(/line (\d+)/);
    this.line = match ? parseInt(match[1], 10) : 0;
}

module.exports = ParsingError;

},{}],4:[function(_dereq_,module,exports){
'use strict';
var format = _dereq_('util').format;

function ValidationError(key, value) {
    var args = [], len = arguments.length - 2;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 2 ];

    this.message = (key ? (key + ": ") : '') + format.apply(format, args);

    if (value !== null && value !== undefined && value.__line__) {
        this.line = value.__line__;
    }
}

module.exports = ValidationError;

},{"util":undefined}],5:[function(_dereq_,module,exports){
'use strict';//      

var ref = _dereq_('./types');
var toString = ref.toString;
var ParsingContext = _dereq_('./parsing_context');
var EvaluationContext = _dereq_('./evaluation_context');
var assert = _dereq_('assert');

                                               
                                    
                                      

                                
                                       
                                                                
                                               
                                                            

var CompoundExpression = function CompoundExpression(key    , name    , type  , evaluate      , args               ) {
    this.key = key;
    this.name = name;
    this.type = type;
    this._evaluate = evaluate;
    this.args = args;
};

CompoundExpression.prototype.evaluate = function evaluate (ctx               ) {
    return this._evaluate(ctx, this.args);
};

CompoundExpression.prototype.eachChild = function eachChild (fn                  ) {
    this.args.forEach(fn);
};

CompoundExpression.parse = function parse (args          , context            )          {
    var op     = (args[0] );
    var definition = CompoundExpression.definitions[op];
    if (!definition) {
        return context.error(("Unknown expression \"" + op + "\". If you wanted a literal array, use [\"literal\", [...]]."), 0);
    }

    // Now check argument types against each signature
    var type = Array.isArray(definition) ?
        definition[0] : definition.type;

    var availableOverloads = Array.isArray(definition) ?
        [[definition[1], definition[2]]] :
        definition.overloads;

    var overloads = availableOverloads.filter(function (ref) {
            var signature = ref[0];

            return (
        !Array.isArray(signature) || // varags
        signature.length === args.length - 1 // correct param count
    );
        });

    // First parse all the args
    var parsedArgs                = [];
    for (var i = 1; i < args.length; i++) {
        var arg = args[i];
        var expected = (void 0);
        if (overloads.length === 1) {
            var params = overloads[0][0];
            expected = Array.isArray(params) ?
                params[i - 1] :
                params.type;
        }
        var parsed = context.parse(arg, 1 + parsedArgs.length, expected);
        if (!parsed) { return null; }
        parsedArgs.push(parsed);
    }

    var signatureContext             = (null );

    for (var i$2 = 0, list = overloads; i$2 < list.length; i$2 += 1) {
        // Use a fresh context for each attempted signature so that, if
        // we eventually succeed, we haven't polluted `context.errors`.
        var ref = list[i$2];
            var params$1 = ref[0];
            var evaluate = ref[1];

            signatureContext = new ParsingContext(context.definitions, context.path, null, context.scope);

        if (Array.isArray(params$1)) {
            if (params$1.length !== parsedArgs.length) {
                signatureContext.error(("Expected " + (params$1.length) + " arguments, but found " + (parsedArgs.length) + " instead."));
                continue;
            }
        }

        for (var i$1 = 0; i$1 < parsedArgs.length; i$1++) {
            var expected$1 = Array.isArray(params$1) ? params$1[i$1] : params$1.type;
            var arg$1 = parsedArgs[i$1];
            signatureContext.concat(i$1 + 1).checkSubtype(expected$1, arg$1.type);
        }

        if (signatureContext.errors.length === 0) {
            return new CompoundExpression(context.key, op, type, evaluate, parsedArgs);
        }
    }

    assert(!signatureContext || signatureContext.errors.length > 0);

    if (overloads.length === 1) {
        context.errors.push.apply(context.errors, signatureContext.errors);
    } else {
        var expected$2 = overloads.length ? overloads : availableOverloads;
        var signatures = expected$2
            .map(function (ref) {
                    var params = ref[0];

                    return stringifySignature(params);
            })
            .join(' | ');
        var actualTypes = parsedArgs
            .map(function (arg) { return toString(arg.type); })
            .join(', ');
        context.error(("Expected arguments of type " + signatures + ", but found (" + actualTypes + ") instead."));
    }

    return null;
};

CompoundExpression.register = function register (
    expressions                             ,
    definitions                          
) {
    assert(!CompoundExpression.definitions);
    CompoundExpression.definitions = definitions;
    for (var name in definitions) {
        expressions[name] = CompoundExpression;
    }
};

function varargs(type      )          {
    return { type: type };
}

function stringifySignature(signature           )         {
    if (Array.isArray(signature)) {
        return ("(" + (signature.map(toString).join(', ')) + ")");
    } else {
        return ("(" + (toString(signature.type)) + "...)");
    }
}

module.exports = {
    CompoundExpression: CompoundExpression,
    varargs: varargs
};

},{"./evaluation_context":20,"./parsing_context":23,"./types":28,"assert":undefined}],6:[function(_dereq_,module,exports){
'use strict';//      

var ref = _dereq_('../types');
var toString = ref.toString;
var array = ref.array;
var ValueType = ref.ValueType;
var StringType = ref.StringType;
var NumberType = ref.NumberType;
var BooleanType = ref.BooleanType;
var checkSubtype = ref.checkSubtype;

var ref$1 = _dereq_('../values');
var typeOf = ref$1.typeOf;
var RuntimeError = _dereq_('../runtime_error');

                                                
                                                     
                                                           
                                          

var types = {
    string: StringType,
    number: NumberType,
    boolean: BooleanType
};

var ArrayAssertion = function ArrayAssertion(key    , type       , input        ) {
    this.key = key;
    this.type = type;
    this.input = input;
};

ArrayAssertion.parse = function parse (args          , context            )          {
    if (args.length < 2 || args.length > 4)
        { return context.error(("Expected 1, 2, or 3 arguments, but found " + (args.length - 1) + " instead.")); }

    var itemType;
    var N;
    if (args.length > 2) {
        var type$1 = args[1];
        if (typeof type$1 !== 'string' || !(type$1 in types))
            { return context.error('The item type argument of "array" must be one of string, number, boolean', 1); }
        itemType = types[type$1];
    } else {
        itemType = ValueType;
    }

    if (args.length > 3) {
        if (
            typeof args[2] !== 'number' ||
            args[2] < 0 ||
            args[2] !== Math.floor(args[2])
        ) {
            return context.error('The length argument to "array" must be a positive integer literal', 2);
        }
        N = args[2];
    }

    var type = array(itemType, N);

    var input = context.parse(args[args.length - 1], args.length - 1, ValueType);
    if (!input) { return null; }

    return new ArrayAssertion(context.key, type, input);
};

ArrayAssertion.prototype.evaluate = function evaluate (ctx               ) {
    var value = this.input.evaluate(ctx);
    var error = checkSubtype(this.type, typeOf(value));
    if (error) {
        throw new RuntimeError(("Expected value to be of type " + (toString(this.type)) + ", but found " + (toString(typeOf(value))) + " instead."));
    }
    return value;
};

ArrayAssertion.prototype.eachChild = function eachChild (fn                  ) {
    fn(this.input);
};

module.exports = ArrayAssertion;

},{"../runtime_error":25,"../types":28,"../values":29}],7:[function(_dereq_,module,exports){
'use strict';//      

var assert = _dereq_('assert');
var ref = _dereq_('../types');
var ObjectType = ref.ObjectType;
var ValueType = ref.ValueType;
var StringType = ref.StringType;
var NumberType = ref.NumberType;
var BooleanType = ref.BooleanType;

var RuntimeError = _dereq_('../runtime_error');
var ref$1 = _dereq_('../types');
var checkSubtype = ref$1.checkSubtype;
var toString = ref$1.toString;
var ref$2 = _dereq_('../values');
var typeOf = ref$2.typeOf;

                                                
                                                     
                                                           
                                     

var types = {
    string: StringType,
    number: NumberType,
    boolean: BooleanType,
    object: ObjectType
};

var Assertion = function Assertion(key    , type  , args               ) {
    this.key = key;
    this.type = type;
    this.args = args;
};

Assertion.parse = function parse (args          , context            )          {
    if (args.length < 2)
        { return context.error("Expected at least one argument."); }

    var name     = (args[0] );
    assert(types[name], name);

    var type = types[name];

    var parsed = [];
    for (var i = 1; i < args.length; i++) {
        var input = context.parse(args[i], i, ValueType);
        if (!input) { return null; }
        parsed.push(input);
    }

    return new Assertion(context.key, type, parsed);
};

Assertion.prototype.evaluate = function evaluate (ctx               ) {
        var this$1 = this;

    for (var i = 0; i < this.args.length; i++) {
        var value = this$1.args[i].evaluate(ctx);
        var error = checkSubtype(this$1.type, typeOf(value));
        if (!error) {
            return value;
        } else if (i === this$1.args.length - 1) {
            throw new RuntimeError(("Expected value to be of type " + (toString(this$1.type)) + ", but found " + (toString(typeOf(value))) + " instead."));
        }
    }

    assert(false);
    return null;
};

Assertion.prototype.eachChild = function eachChild (fn                  ) {
    this.args.forEach(fn);
};

module.exports = Assertion;

},{"../runtime_error":25,"../types":28,"../values":29,"assert":undefined}],8:[function(_dereq_,module,exports){
'use strict';//      

var ref = _dereq_('../types');
var array = ref.array;
var ValueType = ref.ValueType;
var NumberType = ref.NumberType;

var RuntimeError = _dereq_('../runtime_error');

                                                
                                                     
                                                           
                                                
                                       

var At = function At(key    , type  , index        , input        ) {
    this.key = key;
    this.type = type;
    this.index = index;
    this.input = input;
};

At.parse = function parse (args          , context            ) {
    if (args.length !== 3)
        { return context.error(("Expected 2 arguments, but found " + (args.length - 1) + " instead.")); }

    var index = context.parse(args[1], 1, NumberType);
    var input = context.parse(args[2], 2, array(context.expectedType || ValueType));

    if (!index || !input) { return null; }

    var t        = (input.type );
    return new At(context.key, t.itemType, index, input);
};

At.prototype.evaluate = function evaluate (ctx               ) {
    var index = ((this.index.evaluate(ctx) )    );
    var array = ((this.input.evaluate(ctx) )          );

    if (index < 0 || index >= array.length) {
        throw new RuntimeError(("Array index out of bounds: " + index + " > " + (array.length) + "."));
    }

    if (index !== Math.floor(index)) {
        throw new RuntimeError(("Array index must be an integer, but found " + index + " instead."));
    }

    return array[index];
};

At.prototype.eachChild = function eachChild (fn                  ) {
    fn(this.index);
    fn(this.input);
};

module.exports = At;

},{"../runtime_error":25,"../types":28}],9:[function(_dereq_,module,exports){
'use strict';//      

var assert = _dereq_('assert');
var ref = _dereq_('../types');
var BooleanType = ref.BooleanType;

                                                
                                                     
                                                           
                                     

                                                

var Case = function Case(key    , type  , branches      , otherwise        ) {
    this.key = key;
    this.type = type;
    this.branches = branches;
    this.otherwise = otherwise;
};

Case.parse = function parse (args          , context            ) {
    if (args.length < 4)
        { return context.error(("Expected at least 3 arguments, but found only " + (args.length - 1) + ".")); }
    if (args.length % 2 !== 0)
        { return context.error("Expected an odd number of arguments."); }

    var outputType   ;
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }

    var branches = [];
    for (var i = 1; i < args.length - 1; i += 2) {
        var test = context.parse(args[i], i, BooleanType);
        if (!test) { return null; }

        var result = context.parse(args[i + 1], i + 1, outputType);
        if (!result) { return null; }

        branches.push([test, result]);

        outputType = outputType || result.type;
    }

    var otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
    if (!otherwise) { return null; }

    assert(outputType);
    return new Case(context.key, (outputType ), branches, otherwise);
};

Case.prototype.evaluate = function evaluate (ctx               ) {
        var this$1 = this;

    for (var i = 0, list = this$1.branches; i < list.length; i += 1) {
        var ref = list[i];
            var test = ref[0];
            var expression = ref[1];

            if (test.evaluate(ctx)) {
            return expression.evaluate(ctx);
        }
    }
    return this.otherwise.evaluate(ctx);
};

Case.prototype.eachChild = function eachChild (fn                  ) {
        var this$1 = this;

    for (var i = 0, list = this$1.branches; i < list.length; i += 1) {
        var ref = list[i];
            var test = ref[0];
            var expression = ref[1];

            fn(test);
        fn(expression);
    }
    fn(this.otherwise);
};

module.exports = Case;

},{"../types":28,"assert":undefined}],10:[function(_dereq_,module,exports){
'use strict';//      

var assert = _dereq_('assert');

                                                
                                                     
                                                           
                                     

var Coalesce = function Coalesce(key    , type  , args               ) {
    this.key = key;
    this.type = type;
    this.args = args;
};

Coalesce.parse = function parse (args          , context            ) {
    if (args.length < 2) {
        return context.error("Expectected at least one argument.");
    }
    var outputType   = (null );
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }
    var parsedArgs = [];
    for (var i = 0, list = args.slice(1); i < list.length; i += 1) {
        var arg = list[i];

            var parsed = context.parse(arg, 1 + parsedArgs.length, outputType);
        if (!parsed) { return null; }
        outputType = outputType || parsed.type;
        parsedArgs.push(parsed);
    }
    assert(outputType);
    return new Coalesce(context.key, (outputType ), parsedArgs);
};

Coalesce.prototype.evaluate = function evaluate (ctx               ) {
        var this$1 = this;

    var result = null;
    for (var i = 0, list = this$1.args; i < list.length; i += 1) {
        var arg = list[i];

            result = arg.evaluate(ctx);
        if (result !== null) { break; }
    }
    return result;
};

Coalesce.prototype.eachChild = function eachChild (fn                  ) {
    this.args.forEach(fn);
};

module.exports = Coalesce;

},{"assert":undefined}],11:[function(_dereq_,module,exports){
'use strict';//      

var assert = _dereq_('assert');
var ref = _dereq_('../types');
var ColorType = ref.ColorType;
var ValueType = ref.ValueType;
var NumberType = ref.NumberType;

var ref$1 = _dereq_('../values');
var Color = ref$1.Color;
var validateRGBA = ref$1.validateRGBA;
var RuntimeError = _dereq_('../runtime_error');

                                                
                                                     
                                                           
                                     

var types = {
    'to-number': NumberType,
    'to-color': ColorType
};

/**
 * Special form for error-coalescing coercion expressions "to-number",
 * "to-color".  Since these coercions can fail at runtime, they accept multiple
 * arguments, only evaluating one at a time until one succeeds.
 *
 * @private
 */
var Coercion = function Coercion(key    , type  , args               ) {
    this.key = key;
    this.type = type;
    this.args = args;
};

Coercion.parse = function parse (args          , context            )          {
    if (args.length < 2)
        { return context.error("Expected at least one argument."); }

    var name     = (args[0] );
    assert(types[name], name);

    var type = types[name];

    var parsed = [];
    for (var i = 1; i < args.length; i++) {
        var input = context.parse(args[i], i, ValueType);
        if (!input) { return null; }
        parsed.push(input);
    }

    return new Coercion(context.key, type, parsed);
};

Coercion.prototype.evaluate = function evaluate (ctx               ) {
        var this$1 = this;

    if (this.type.kind === 'color') {
        var input;
        var error;
        for (var i = 0, list = this$1.args; i < list.length; i += 1) {
            var arg = list[i];

                input = arg.evaluate(ctx);
            error = null;
            if (typeof input === 'string') {
                var c = ctx.parseColor(input);
                if (c) { return c; }
            } else if (Array.isArray(input)) {
                if (input.length < 3 || input.length > 4) {
                    error = "Invalid rbga value " + (JSON.stringify(input)) + ": expected an array containing either three or four numeric values.";
                } else {
                    error = validateRGBA(input[0], input[1], input[2], input[3]);
                }
                if (!error) {
                    return new Color((input[0] ) / 255, (input[1] ) / 255, (input[2] ) / 255, (input[3] ));
                }
            }
        }
        throw new RuntimeError(error || ("Could not parse color from value '" + (typeof input === 'string' ? input : JSON.stringify(input)) + "'"));
    } else {
        var value = null;
        for (var i$1 = 0, list$1 = this$1.args; i$1 < list$1.length; i$1 += 1) {
            var arg$1 = list$1[i$1];

                value = arg$1.evaluate(ctx);
            if (value === null) { continue; }
            var num = Number(value);
            if (isNaN(num)) { continue; }
            return num;
        }
        throw new RuntimeError(("Could not convert " + (JSON.stringify(value)) + " to number."));
    }
};

Coercion.prototype.eachChild = function eachChild (fn                  ) {
    this.args.forEach(fn);
};

module.exports = Coercion;

},{"../runtime_error":25,"../types":28,"../values":29,"assert":undefined}],12:[function(_dereq_,module,exports){
'use strict';//      

                                                
                                                     
                                     

var Curve = function Curve () {};

Curve.parse = function parse (args          , context            ) {
    var interpolation = args[1];
        var input = args[2];
        var rest = args.slice(3);
    if ((interpolation )[0] === "step") {
        return context.error(("\"curve\" has been replaced by \"step\" and \"interpolate\". Replace this expression with " + (JSON.stringify(["step", input ].concat( rest)))), 0);
    } else {
        return context.error(("\"curve\" has been replaced by \"step\" and \"interpolate\". Replace this expression with " + (JSON.stringify(["interpolate", interpolation, input ].concat( rest)))), 0);
    }
};

Curve.prototype.evaluate = function evaluate () {};
Curve.prototype.eachChild = function eachChild () {};

module.exports = Curve;

},{}],13:[function(_dereq_,module,exports){
'use strict';//      

var ref = _dereq_('../types');
var NullType = ref.NullType;
var NumberType = ref.NumberType;
var StringType = ref.StringType;
var BooleanType = ref.BooleanType;
var ColorType = ref.ColorType;
var ObjectType = ref.ObjectType;
var ValueType = ref.ValueType;
var ErrorType = ref.ErrorType;
var array = ref.array;
var toString = ref.toString;

var ref$1 = _dereq_('../values');
var typeOf = ref$1.typeOf;
var Color = ref$1.Color;
var validateRGBA = ref$1.validateRGBA;
var ref$2 = _dereq_('../compound_expression');
var CompoundExpression = ref$2.CompoundExpression;
var varargs = ref$2.varargs;
var RuntimeError = _dereq_('../runtime_error');
var Let = _dereq_('./let');
var Var = _dereq_('./var');
var Literal = _dereq_('./literal');
var Assertion = _dereq_('./assertion');
var ArrayAssertion = _dereq_('./array');
var Coercion = _dereq_('./coercion');
var At = _dereq_('./at');
var Match = _dereq_('./match');
var Case = _dereq_('./case');
var Curve = _dereq_('./curve');
var Step = _dereq_('./step');
var Interpolate = _dereq_('./interpolate');
var Coalesce = _dereq_('./coalesce');

                                                

var expressions                                  = {
    // special forms
    'let': Let,
    'var': Var,
    'literal': Literal,
    'string': Assertion,
    'number': Assertion,
    'boolean': Assertion,
    'object': Assertion,
    'array': ArrayAssertion,
    'to-number': Coercion,
    'to-color': Coercion,
    'at': At,
    'case': Case,
    'match': Match,
    'coalesce': Coalesce,
    'curve': Curve,
    'step': Step,
    'interpolate': Interpolate
};

function rgba(ctx, ref) {
    var r = ref[0];
    var g = ref[1];
    var b = ref[2];
    var a = ref[3];

    r = r.evaluate(ctx);
    g = g.evaluate(ctx);
    b = b.evaluate(ctx);
    a = a && a.evaluate(ctx);
    var error = validateRGBA(r, g, b, a);
    if (error) { throw new RuntimeError(error); }
    return new Color(r / 255, g / 255, b / 255, a);
}

function has(key, obj) {
    return key in obj;
}

function get(key, obj) {
    var v = obj[key];
    return typeof v === 'undefined' ? null : v;
}

function length(ctx, ref) {
    var v = ref[0];

    return v.evaluate(ctx).length;
}

function eq(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) === b.evaluate(ctx); }
function ne(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) !== b.evaluate(ctx); }
function lt(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) < b.evaluate(ctx); }
function gt(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) > b.evaluate(ctx); }
function lteq(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) <= b.evaluate(ctx); }
function gteq(ctx, ref) {
var a = ref[0];
var b = ref[1];
 return a.evaluate(ctx) >= b.evaluate(ctx); }

CompoundExpression.register(expressions, {
    'error': [
        ErrorType,
        [StringType],
        function (ctx, ref) {
        var v = ref[0];
 throw new RuntimeError(v.evaluate(ctx)); }
    ],
    'typeof': [
        StringType,
        [ValueType],
        function (ctx, ref) {
            var v = ref[0];

            return toString(typeOf(v.evaluate(ctx)));
}
    ],
    'to-string': [
        StringType,
        [ValueType],
        function (ctx, ref) {
            var v = ref[0];

            v = v.evaluate(ctx);
            var type = typeof v;
            if (v === null || type === 'string' || type === 'number' || type === 'boolean') {
                return String(v);
            } else if (v instanceof Color) {
                return ("rgba(" + (v.r * 255) + "," + (v.g * 255) + "," + (v.b * 255) + "," + (v.a) + ")");
            } else {
                return JSON.stringify(v);
            }
        }
    ],
    'to-boolean': [
        BooleanType,
        [ValueType],
        function (ctx, ref) {
            var v = ref[0];

            return Boolean(v.evaluate(ctx));
}
    ],
    'to-rgba': [
        array(NumberType, 4),
        [ColorType],
        function (ctx, ref) {
            var v = ref[0];

            var ref$1 = v.evaluate(ctx);
            var r = ref$1.r;
            var g = ref$1.g;
            var b = ref$1.b;
            var a = ref$1.a;
            return [r, g, b, a];
        }
    ],
    'rgb': [
        ColorType,
        [NumberType, NumberType, NumberType],
        rgba
    ],
    'rgba': [
        ColorType,
        [NumberType, NumberType, NumberType, NumberType],
        rgba
    ],
    'length': {
        type: NumberType,
        overloads: [
            [
                [StringType],
                length
            ], [
                [array(ValueType)],
                length
            ]
        ]
    },
    'has': {
        type: BooleanType,
        overloads: [
            [
                [StringType],
                function (ctx, ref) {
                    var key = ref[0];

                    return has(key.evaluate(ctx), ctx.properties());
}
            ], [
                [StringType, ObjectType],
                function (ctx, ref) {
                    var key = ref[0];
                    var obj = ref[1];

                    return has(key.evaluate(ctx), obj.evaluate(ctx));
}
            ]
        ]
    },
    'get': {
        type: ValueType,
        overloads: [
            [
                [StringType],
                function (ctx, ref) {
                    var key = ref[0];

                    return get(key.evaluate(ctx), ctx.properties());
}
            ], [
                [StringType, ObjectType],
                function (ctx, ref) {
                    var key = ref[0];
                    var obj = ref[1];

                    return get(key.evaluate(ctx), obj.evaluate(ctx));
}
            ]
        ]
    },
    'properties': [
        ObjectType,
        [],
        function (ctx) { return ctx.properties(); }
    ],
    'geometry-type': [
        StringType,
        [],
        function (ctx) { return ctx.geometryType(); }
    ],
    'id': [
        ValueType,
        [],
        function (ctx) { return ctx.id(); }
    ],
    'zoom': [
        NumberType,
        [],
        function (ctx) { return ctx.globals.zoom; }
    ],
    'heatmap-density': [
        NumberType,
        [],
        function (ctx) { return ctx.globals.heatmapDensity || 0; }
    ],
    '+': [
        NumberType,
        varargs(NumberType),
        function (ctx, args) {
            var result = 0;
            for (var i = 0, list = args; i < list.length; i += 1) {
                var arg = list[i];

                result += arg.evaluate(ctx);
            }
            return result;
        }
    ],
    '*': [
        NumberType,
        varargs(NumberType),
        function (ctx, args) {
            var result = 1;
            for (var i = 0, list = args; i < list.length; i += 1) {
                var arg = list[i];

                result *= arg.evaluate(ctx);
            }
            return result;
        }
    ],
    '-': {
        type: NumberType,
        overloads: [
            [
                [NumberType, NumberType],
                function (ctx, ref) {
                    var a = ref[0];
                    var b = ref[1];

                    return a.evaluate(ctx) - b.evaluate(ctx);
}
            ], [
                [NumberType],
                function (ctx, ref) {
                    var a = ref[0];

                    return -a.evaluate(ctx);
}
            ]
        ]
    },
    '/': [
        NumberType,
        [NumberType, NumberType],
        function (ctx, ref) {
            var a = ref[0];
            var b = ref[1];

            return a.evaluate(ctx) / b.evaluate(ctx);
}
    ],
    '%': [
        NumberType,
        [NumberType, NumberType],
        function (ctx, ref) {
            var a = ref[0];
            var b = ref[1];

            return a.evaluate(ctx) % b.evaluate(ctx);
}
    ],
    'ln2': [
        NumberType,
        [],
        function () { return Math.LN2; }
    ],
    'pi': [
        NumberType,
        [],
        function () { return Math.PI; }
    ],
    'e': [
        NumberType,
        [],
        function () { return Math.E; }
    ],
    '^': [
        NumberType,
        [NumberType, NumberType],
        function (ctx, ref) {
            var b = ref[0];
            var e = ref[1];

            return Math.pow(b.evaluate(ctx), e.evaluate(ctx));
}
    ],
    'sqrt': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var x = ref[0];

            return Math.sqrt(x.evaluate(ctx));
}
    ],
    'log10': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.log10(n.evaluate(ctx));
}
    ],
    'ln': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.log(n.evaluate(ctx));
}
    ],
    'log2': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.log2(n.evaluate(ctx));
}
    ],
    'sin': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.sin(n.evaluate(ctx));
}
    ],
    'cos': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.cos(n.evaluate(ctx));
}
    ],
    'tan': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.tan(n.evaluate(ctx));
}
    ],
    'asin': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.asin(n.evaluate(ctx));
}
    ],
    'acos': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.acos(n.evaluate(ctx));
}
    ],
    'atan': [
        NumberType,
        [NumberType],
        function (ctx, ref) {
            var n = ref[0];

            return Math.atan(n.evaluate(ctx));
}
    ],
    'min': [
        NumberType,
        varargs(NumberType),
        function (ctx, args) { return Math.min.apply(Math, args.map(function (arg) { return arg.evaluate(ctx); })); }
    ],
    'max': [
        NumberType,
        varargs(NumberType),
        function (ctx, args) { return Math.max.apply(Math, args.map(function (arg) { return arg.evaluate(ctx); })); }
    ],
    '==': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], eq],
            [[StringType, StringType], eq],
            [[BooleanType, BooleanType], eq],
            [[NullType, NullType], eq]
        ]
    },
    '!=': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], ne],
            [[StringType, StringType], ne],
            [[BooleanType, BooleanType], ne],
            [[NullType, NullType], ne]
        ]
    },
    '>': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], gt],
            [[StringType, StringType], gt]
        ]
    },
    '<': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], lt],
            [[StringType, StringType], lt]
        ]
    },
    '>=': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], gteq],
            [[StringType, StringType], gteq]
        ]
    },
    '<=': {
        type: BooleanType,
        overloads: [
            [[NumberType, NumberType], lteq],
            [[StringType, StringType], lteq]
        ]
    },
    'all': {
        type: BooleanType,
        overloads: [
            [
                [BooleanType, BooleanType],
                function (ctx, ref) {
                    var a = ref[0];
                    var b = ref[1];

                    return a.evaluate(ctx) && b.evaluate(ctx);
}
            ],
            [
                varargs(BooleanType),
                function (ctx, args) {
                    for (var i = 0, list = args; i < list.length; i += 1) {
                        var arg = list[i];

                        if (!arg.evaluate(ctx))
                            { return false; }
                    }
                    return true;
                }
            ]
        ]
    },
    'any': {
        type: BooleanType,
        overloads: [
            [
                [BooleanType, BooleanType],
                function (ctx, ref) {
                    var a = ref[0];
                    var b = ref[1];

                    return a.evaluate(ctx) || b.evaluate(ctx);
}
            ],
            [
                varargs(BooleanType),
                function (ctx, args) {
                    for (var i = 0, list = args; i < list.length; i += 1) {
                        var arg = list[i];

                        if (arg.evaluate(ctx))
                            { return true; }
                    }
                    return false;
                }
            ]
        ]
    },
    '!': [
        BooleanType,
        [BooleanType],
        function (ctx, ref) {
            var b = ref[0];

            return !b.evaluate(ctx);
}
    ],
    'upcase': [
        StringType,
        [StringType],
        function (ctx, ref) {
            var s = ref[0];

            return s.evaluate(ctx).toUpperCase();
}
    ],
    'downcase': [
        StringType,
        [StringType],
        function (ctx, ref) {
            var s = ref[0];

            return s.evaluate(ctx).toLowerCase();
}
    ],
    'concat': [
        StringType,
        varargs(StringType),
        function (ctx, args) { return args.map(function (arg) { return arg.evaluate(ctx); }).join(''); }
    ]
});

module.exports = expressions;

},{"../compound_expression":5,"../runtime_error":25,"../types":28,"../values":29,"./array":6,"./assertion":7,"./at":8,"./case":9,"./coalesce":10,"./coercion":11,"./curve":12,"./interpolate":14,"./let":15,"./literal":16,"./match":17,"./step":18,"./var":19}],14:[function(_dereq_,module,exports){
'use strict';//      

var UnitBezier = _dereq_('@mapbox/unitbezier');
var interpolate = _dereq_('../../util/interpolate');
var ref = _dereq_('../types');
var toString = ref.toString;
var NumberType = ref.NumberType;
var ref$1 = _dereq_("../stops");
var findStopLessThanOrEqualTo = ref$1.findStopLessThanOrEqualTo;

                                      
                                                
                                                     
                                                           
                                     

                               
                        
                                           
                                                                              

var Interpolate = function Interpolate(key    , type  , interpolation               , input        , stops   ) {
    var this$1 = this;

    this.key = key;
    this.type = type;
    this.interpolation = interpolation;
    this.input = input;

    this.labels = [];
    this.outputs = [];
    for (var i = 0, list = stops; i < list.length; i += 1) {
        var ref = list[i];
        var label = ref[0];
        var expression = ref[1];

        this$1.labels.push(label);
        this$1.outputs.push(expression);
    }
};

Interpolate.interpolationFactor = function interpolationFactor (interpolation               , input    , lower    , upper    ) {
    var t = 0;
    if (interpolation.name === 'exponential') {
        t = exponentialInterpolation(input, interpolation.base, lower, upper);
    } else if (interpolation.name === 'linear') {
        t = exponentialInterpolation(input, 1, lower, upper);
    } else if (interpolation.name === 'cubic-bezier') {
        var c = interpolation.controlPoints;
        var ub = new UnitBezier(c[0], c[1], c[2], c[3]);
        t = ub.solve(exponentialInterpolation(input, 1, lower, upper));
    }
    return t;
};

Interpolate.parse = function parse (args          , context            ) {
    var interpolation = args[1];
        var input = args[2];
        var rest = args.slice(3);

    if (!Array.isArray(interpolation) || interpolation.length === 0) {
        return context.error("Expected an interpolation type expression.", 1);
    }

    if (interpolation[0] === 'linear') {
        interpolation = { name: 'linear' };
    } else if (interpolation[0] === 'exponential') {
        var base = interpolation[1];
        if (typeof base !== 'number')
            { return context.error("Exponential interpolation requires a numeric base.", 1, 1); }
        interpolation = {
            name: 'exponential',
            base: base
        };
    } else if (interpolation[0] === 'cubic-bezier') {
        var controlPoints = interpolation.slice(1);
        if (
            controlPoints.length !== 4 ||
            controlPoints.some(function (t) { return typeof t !== 'number' || t < 0 || t > 1; })
        ) {
            return context.error('Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.', 1);
        }

        interpolation = {
            name: 'cubic-bezier',
            controlPoints: (controlPoints )
        };
    } else {
        return context.error(("Unknown interpolation type " + (String(interpolation[0]))), 1, 0);
    }

    if (args.length - 1 < 4) {
        return context.error(("Expected at least 4 arguments, but found only " + (args.length - 1) + "."));
    }

    if ((args.length - 1) % 2 !== 0) {
        return context.error("Expected an even number of arguments.");
    }

    input = context.parse(input, 2, NumberType);
    if (!input) { return null; }

    var stops    = [];

    var outputType   = (null );
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }

    for (var i = 0; i < rest.length; i += 2) {
        var label = rest[i];
        var value = rest[i + 1];

        var labelKey = i + 3;
        var valueKey = i + 4;

        if (typeof label !== 'number') {
            return context.error('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
        }

        if (stops.length && stops[stops.length - 1][0] > label) {
            return context.error('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.', labelKey);
        }

        var parsed = context.parse(value, valueKey, outputType);
        if (!parsed) { return null; }
        outputType = outputType || parsed.type;
        stops.push([label, parsed]);
    }

    if (outputType.kind !== 'number' &&
        outputType.kind !== 'color' &&
        !(
            outputType.kind === 'array' &&
            outputType.itemType.kind === 'number' &&
            typeof outputType.N === 'number'
        )
    ) {
        return context.error(("Type " + (toString(outputType)) + " is not interpolatable."));
    }

    return new Interpolate(context.key, outputType, interpolation, input, stops);
};

Interpolate.prototype.evaluate = function evaluate (ctx               ) {
    var labels = this.labels;
    var outputs = this.outputs;

    if (labels.length === 1) {
        return outputs[0].evaluate(ctx);
    }

    var value = ((this.input.evaluate(ctx) )    );
    if (value <= labels[0]) {
        return outputs[0].evaluate(ctx);
    }

    var stopCount = labels.length;
    if (value >= labels[stopCount - 1]) {
        return outputs[stopCount - 1].evaluate(ctx);
    }

    var index = findStopLessThanOrEqualTo(labels, value);
    var lower = labels[index];
    var upper = labels[index + 1];
    var t = Interpolate.interpolationFactor(this.interpolation, value, lower, upper);

    var outputLower = outputs[index].evaluate(ctx);
    var outputUpper = outputs[index + 1].evaluate(ctx);

    return (interpolate[this.type.kind.toLowerCase()] )(outputLower, outputUpper, t);
};

Interpolate.prototype.eachChild = function eachChild (fn                  ) {
        var this$1 = this;

    fn(this.input);
    for (var i = 0, list = this$1.outputs; i < list.length; i += 1) {
        var expression = list[i];

            fn(expression);
    }
};

/**
 * Returns a ratio that can be used to interpolate between exponential function
 * stops.
 * How it works: Two consecutive stop values define a (scaled and shifted) exponential function `f(x) = a * base^x + b`, where `base` is the user-specified base,
 * and `a` and `b` are constants affording sufficient degrees of freedom to fit
 * the function to the given stops.
 *
 * Here's a bit of algebra that lets us compute `f(x)` directly from the stop
 * values without explicitly solving for `a` and `b`:
 *
 * First stop value: `f(x0) = y0 = a * base^x0 + b`
 * Second stop value: `f(x1) = y1 = a * base^x1 + b`
 * => `y1 - y0 = a(base^x1 - base^x0)`
 * => `a = (y1 - y0)/(base^x1 - base^x0)`
 *
 * Desired value: `f(x) = y = a * base^x + b`
 * => `f(x) = y0 + a * (base^x - base^x0)`
 *
 * From the above, we can replace the `a` in `a * (base^x - base^x0)` and do a
 * little algebra:
 * ```
 * a * (base^x - base^x0) = (y1 - y0)/(base^x1 - base^x0) * (base^x - base^x0)
 *                     = (y1 - y0) * (base^x - base^x0) / (base^x1 - base^x0)
 * ```
 *
 * If we let `(base^x - base^x0) / (base^x1 base^x0)`, then we have
 * `f(x) = y0 + (y1 - y0) * ratio`.  In other words, `ratio` may be treated as
 * an interpolation factor between the two stops' output values.
 *
 * (Note: a slightly different form for `ratio`,
 * `(base^(x-x0) - 1) / (base^(x1-x0) - 1) `, is equivalent, but requires fewer
 * expensive `Math.pow()` operations.)
 *
 * @private
*/
function exponentialInterpolation(input, base, lowerValue, upperValue) {
    var difference = upperValue - lowerValue;
    var progress = input - lowerValue;

    if (difference === 0) {
        return 0;
    } else if (base === 1) {
        return progress / difference;
    } else {
        return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
    }
}

module.exports = Interpolate;

},{"../../util/interpolate":46,"../stops":27,"../types":28,"@mapbox/unitbezier":undefined}],15:[function(_dereq_,module,exports){
'use strict';//      

                                     
                                                
                                                     
                                                            

var Let = function Let(key    , bindings                         , result        ) {
    this.key = key;
    this.type = result.type;
    this.bindings = [].concat(bindings);
    this.result = result;
};

Let.prototype.evaluate = function evaluate (ctx               ) {
    ctx.pushScope(this.bindings);
    var result = this.result.evaluate(ctx);
    ctx.popScope();
    return result;
};

Let.prototype.eachChild = function eachChild (fn                  ) {
        var this$1 = this;

    for (var i = 0, list = this$1.bindings; i < list.length; i += 1) {
        var binding = list[i];

            fn(binding[1]);
    }
    fn(this.result);
};

Let.parse = function parse (args          , context            ) {
    if (args.length < 4)
        { return context.error(("Expected at least 3 arguments, but found " + (args.length - 1) + " instead.")); }

    var bindings                          = [];
    for (var i = 1; i < args.length - 1; i += 2) {
        var name = args[i];

        if (typeof name !== 'string') {
            return context.error(("Expected string, but found " + (typeof name) + " instead."), i);
        }

        if (/[^a-zA-Z0-9_]/.test(name)) {
            return context.error("Variable names must contain only alphanumeric characters or '_'.", i);
        }

        var value = context.parse(args[i + 1], i + 1);
        if (!value) { return null; }

        bindings.push([name, value]);
    }

    var result = context.parse(args[args.length - 1], args.length - 1, undefined, bindings);
    if (!result) { return null; }

    return new Let(context.key, bindings, result);
};

module.exports = Let;

},{}],16:[function(_dereq_,module,exports){
'use strict';//      

var ref = _dereq_('../values');
var isValue = ref.isValue;
var typeOf = ref.typeOf;

                                     
                                        
                                                
                                                     

var Literal = function Literal(key   , type  , value   ) {
    this.key = key;
    this.type = type;
    this.value = value;
};

Literal.parse = function parse (args          , context            ) {
    if (args.length !== 2)
        { return context.error(("'literal' expression requires exactly one argument, but found " + (args.length - 1) + " instead.")); }

    if (!isValue(args[1]))
        { return context.error("invalid value"); }

    var value = (args[1] );
    var type = typeOf(value);

    // special case: infer the item type if possible for zero-length arrays
    var expected = context.expectedType;
    if (
        type.kind === 'array' &&
        type.N === 0 &&
        expected &&
        expected.kind === 'array' &&
        (typeof expected.N !== 'number' || expected.N === 0)
    ) {
        type = expected;
    }

    return new Literal(context.key, type, value);
};

Literal.prototype.evaluate = function evaluate () {
    return this.value;
};

Literal.prototype.eachChild = function eachChild () {};

module.exports = Literal;

},{"../values":29}],17:[function(_dereq_,module,exports){
'use strict';//      

var assert = _dereq_('assert');
var ref = _dereq_('../values');
var typeOf = ref.typeOf;

                                                
                                                     
                                                           
                                     

// Map input label values to output expression index
                                         

var Match = function Match(key    , inputType  , outputType  , input        , cases   , outputs               , otherwise        ) {
    this.key = key;
    this.inputType = inputType;
    this.type = outputType;
    this.input = input;
    this.cases = cases;
    this.outputs = outputs;
    this.otherwise = otherwise;
};

Match.parse = function parse (args          , context            ) {
    if (args.length < 5)
        { return context.error(("Expected at least 4 arguments, but found only " + (args.length - 1) + ".")); }
    if (args.length % 2 !== 1)
        { return context.error("Expected an even number of arguments."); }

    var inputType;
    var outputType;
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }
    var cases = {};
    var outputs = [];
    for (var i = 2; i < args.length - 1; i += 2) {
        var labels = args[i];
        var value = args[i + 1];

        if (!Array.isArray(labels)) {
            labels = [labels];
        }

        var labelContext = context.concat(i);
        if (labels.length === 0) {
            return labelContext.error('Expected at least one branch label.');
        }

        for (var i$1 = 0, list = labels; i$1 < list.length; i$1 += 1) {
            var label = list[i$1];

                if (typeof label !== 'number' && typeof label !== 'string') {
                return labelContext.error("Branch labels must be numbers or strings.");
            } else if (typeof label === 'number' && Math.abs(label) > Number.MAX_SAFE_INTEGER) {
                return labelContext.error(("Branch labels must be integers no larger than " + (Number.MAX_SAFE_INTEGER) + "."));

            } else if (typeof label === 'number' && Math.floor(label) !== label) {
                return labelContext.error("Numeric branch labels must be integer values.");

            } else if (!inputType) {
                inputType = typeOf(label);
            } else if (labelContext.checkSubtype(inputType, typeOf(label))) {
                return null;
            }

            if (typeof cases[String(label)] !== 'undefined') {
                return labelContext.error('Branch labels must be unique.');
            }

            cases[String(label)] = outputs.length;
        }

        var result = context.parse(value, i, outputType);
        if (!result) { return null; }
        outputType = outputType || result.type;
        outputs.push(result);
    }

    var input = context.parse(args[1], 1, inputType);
    if (!input) { return null; }

    var otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
    if (!otherwise) { return null; }

    assert(inputType && outputType);
    return new Match(context.key, (inputType ), (outputType ), input, cases, outputs, otherwise);
};

Match.prototype.evaluate = function evaluate (ctx               ) {
    var input = (this.input.evaluate(ctx) );
    return (this.outputs[this.cases[input]] || this.otherwise).evaluate(ctx);
};

Match.prototype.eachChild = function eachChild (fn                  ) {
    fn(this.input);
    this.outputs.forEach(fn);
    fn(this.otherwise);
};

module.exports = Match;

},{"../values":29,"assert":undefined}],18:[function(_dereq_,module,exports){
'use strict';//      

var ref = _dereq_('../types');
var NumberType = ref.NumberType;
var ref$1 = _dereq_("../stops");
var findStopLessThanOrEqualTo = ref$1.findStopLessThanOrEqualTo;

                                      
                                                
                                                     
                                                           
                                     

var Step = function Step(key    , type  , input        , stops   ) {
    var this$1 = this;

    this.key = key;
    this.type = type;
    this.input = input;

    this.labels = [];
    this.outputs = [];
    for (var i = 0, list = stops; i < list.length; i += 1) {
        var ref = list[i];
        var label = ref[0];
        var expression = ref[1];

        this$1.labels.push(label);
        this$1.outputs.push(expression);
    }
};

Step.parse = function parse (args          , context            ) {
    var input = args[1];
        var rest = args.slice(2);

    if (args.length - 1 < 4) {
        return context.error(("Expected at least 4 arguments, but found only " + (args.length - 1) + "."));
    }

    if ((args.length - 1) % 2 !== 0) {
        return context.error("Expected an even number of arguments.");
    }

    input = context.parse(input, 1, NumberType);
    if (!input) { return null; }

    var stops    = [];

    var outputType   = (null );
    if (context.expectedType && context.expectedType.kind !== 'value') {
        outputType = context.expectedType;
    }

    rest.unshift(-Infinity);

    for (var i = 0; i < rest.length; i += 2) {
        var label = rest[i];
        var value = rest[i + 1];

        var labelKey = i + 1;
        var valueKey = i + 2;

        if (typeof label !== 'number') {
            return context.error('Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
        }

        if (stops.length && stops[stops.length - 1][0] > label) {
            return context.error('Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.', labelKey);
        }

        var parsed = context.parse(value, valueKey, outputType);
        if (!parsed) { return null; }
        outputType = outputType || parsed.type;
        stops.push([label, parsed]);
    }

    return new Step(context.key, outputType, input, stops);
};

Step.prototype.evaluate = function evaluate (ctx               ) {
    var labels = this.labels;
    var outputs = this.outputs;

    if (labels.length === 1) {
        return outputs[0].evaluate(ctx);
    }

    var value = ((this.input.evaluate(ctx) )    );
    if (value <= labels[0]) {
        return outputs[0].evaluate(ctx);
    }

    var stopCount = labels.length;
    if (value >= labels[stopCount - 1]) {
        return outputs[stopCount - 1].evaluate(ctx);
    }

    var index = findStopLessThanOrEqualTo(labels, value);
    return outputs[index].evaluate(ctx);
};

Step.prototype.eachChild = function eachChild (fn                  ) {
        var this$1 = this;

    fn(this.input);
    for (var i = 0, list = this$1.outputs; i < list.length; i += 1) {
        var expression = list[i];

            fn(expression);
    }
};

module.exports = Step;

},{"../stops":27,"../types":28}],19:[function(_dereq_,module,exports){
'use strict';//      

                                     
                                                
                                                     
                                                            

var Var = function Var(key    , name    , type  ) {
    this.key = key;
    this.type = type;
    this.name = name;
};

Var.parse = function parse (args          , context            ) {
    if (args.length !== 2 || typeof args[1] !== 'string')
        { return context.error("'var' expression requires exactly one string literal argument."); }

    var name = args[1];
    if (!context.scope.has(name)) {
        return context.error(("Unknown variable \"" + name + "\". Make sure \"" + name + "\" has been bound in an enclosing \"let\" expression before using it."), 1);
    }

    return new Var(context.key, name, context.scope.get(name).type);
};

Var.prototype.evaluate = function evaluate (ctx               ) {
    return ctx.scope.get(this.name).evaluate(ctx);
};

Var.prototype.eachChild = function eachChild () {};

module.exports = Var;

},{}],20:[function(_dereq_,module,exports){
'use strict';//      

var assert = _dereq_('assert');
var Scope = _dereq_('./scope');
var ref = _dereq_('./values');
var Color = ref.Color;

                                                         
                                               

var geometryTypes = ['Unknown', 'Point', 'LineString', 'Polygon'];

var EvaluationContext = function EvaluationContext() {
    this.scope = new Scope();
    this._parseColorCache = {};
};

EvaluationContext.prototype.id = function id () {
    return this.feature && 'id' in this.feature ? this.feature.id : null;
};

EvaluationContext.prototype.geometryType = function geometryType () {
    return this.feature ? typeof this.feature.type === 'number' ? geometryTypes[this.feature.type] : this.feature.type : null;
};

EvaluationContext.prototype.properties = function properties () {
    return this.feature && this.feature.properties || {};
};

EvaluationContext.prototype.pushScope = function pushScope (bindings                         ) {
    this.scope = this.scope.concat(bindings);
};

EvaluationContext.prototype.popScope = function popScope () {
    assert(this.scope.parent);
    this.scope = (this.scope.parent );
};

EvaluationContext.prototype.parseColor = function parseColor (input    )     {
    var cached = this._parseColorCache[input];
    if (!cached) {
        cached = this._parseColorCache[input] = Color.parse(input);
    }
    return cached;
};

module.exports = EvaluationContext;

},{"./scope":26,"./values":29,"assert":undefined}],21:[function(_dereq_,module,exports){
'use strict';//      

var assert = _dereq_('assert');
var ParsingError = _dereq_('./parsing_error');
var ParsingContext = _dereq_('./parsing_context');
var EvaluationContext = _dereq_('./evaluation_context');
var ref = _dereq_('./compound_expression');
var CompoundExpression = ref.CompoundExpression;
var Step = _dereq_('./definitions/step');
var Interpolate = _dereq_('./definitions/interpolate');
var Coalesce = _dereq_('./definitions/coalesce');
var Let = _dereq_('./definitions/let');
var definitions = _dereq_('./definitions');
var isConstant = _dereq_('./is_constant');

                                  
                                    
                                             

                       
                                                                                                                          
              
                                
  

                                
                 
                           
  

                                                           

                                     
                    
                               
  

                               
                      
                                    
                         
                               
                                                                    
                         
  

                                                                   
                      
                        
                          
                               
                                                                    
                          
                                                                                 
                            
  

                                                              
                      
                      
                          
                               
                                                           
                          
  

                                                                                 

                                          
                   
                        
                                 
                    
     
                   
                        
                                 
                    
     
                    
                        
                                 
                     
     
                 
                        
                                 
                           
                    
     
                  
                        
                                 
                                           
                    
                          
     
                  
                        
                                 
                    
  

function isExpression(expression       ) {
    return Array.isArray(expression) && expression.length > 0 &&
        typeof expression[0] === 'string' && expression[0] in definitions;
}

/**
 * Parse and typecheck the given style spec JSON expression.  If
 * options.defaultValue is provided, then the resulting StyleExpression's
 * `evaluate()` method will handle errors by logging a warning (once per
 * message) and returning the default value.  Otherwise, it will throw
 * evaluation errors.
 *
 * @private
 */
function createExpression(expression       ,
                          propertySpec                            ,
                          context                        ,
                          options)                                          {
    if ( options === void 0 ) options                           = {};

    var parser = new ParsingContext(definitions, [], getExpectedType(propertySpec));
    var parsed = parser.parse(expression);
    if (!parsed) {
        assert(parser.errors.length > 0);
        return {
            result: 'error',
            errors: parser.errors
        };
    }

    var evaluator = new EvaluationContext();

    var evaluate;
    if (options.handleErrors === false) {
        evaluate = function (globals, feature) {
            evaluator.globals = globals;
            evaluator.feature = feature;
            return parsed.evaluate(evaluator);
        };
    } else {
        var warningHistory                           = {};
        var defaultValue = getDefaultValue(propertySpec);
        evaluate = function (globals, feature) {
            evaluator.globals = globals;
            evaluator.feature = feature;
            try {
                var val = parsed.evaluate(evaluator);
                if (val === null || val === undefined) {
                    return defaultValue;
                }
                return val;
            } catch (e) {
                if (!warningHistory[e.message]) {
                    warningHistory[e.message] = true;
                    if (typeof console !== 'undefined') {
                        console.warn(e.message);
                    }
                }
                return defaultValue;
            }
        };
    }

    var isFeatureConstant = isConstant.isFeatureConstant(parsed);
    if (!isFeatureConstant && context === 'property' && !propertySpec['property-function']) {
        return {
            result: 'error',
            errors: [new ParsingError('', 'property expressions not supported')]
        };
    }

    var isZoomConstant = isConstant.isGlobalPropertyConstant(parsed, ['zoom']);
    if (isZoomConstant) {
        return {
            result: 'success',
            context: context,
            isZoomConstant: true,
            isFeatureConstant: isFeatureConstant,
            evaluate: evaluate,
            parsed: parsed
        };
    } else if (context === 'filter') {
        return {
            result: 'success',
            context: 'filter',
            isZoomConstant: false,
            isFeatureConstant: isFeatureConstant,
            evaluate: evaluate,
            parsed: parsed
        };
    }

    var zoomCurve = findZoomCurve(parsed);
    if (!zoomCurve) {
        return {
            result: 'error',
            errors: [new ParsingError('', '"zoom" expression may only be used as input to a top-level "step" or "interpolate" expression.')]
        };
    } else if (!(zoomCurve instanceof Step || zoomCurve instanceof Interpolate)) {
        return {
            result: 'error',
            errors: [new ParsingError(zoomCurve.key, zoomCurve.error)]
        };
    } else if (zoomCurve instanceof Interpolate && propertySpec['function'] === 'piecewise-constant') {
        return {
            result: 'error',
            errors: [new ParsingError(zoomCurve.key, '"interpolate" expressions cannot be used with this property')]
        };
    }

    return {
        result: 'success',
        context: 'property',
        isZoomConstant: false,
        isFeatureConstant: isFeatureConstant,
        evaluate: evaluate,
        parsed: parsed,

        // capture metadata from the curve definition that's needed for
        // our prepopulate-and-interpolate approach to paint properties
        // that are zoom-and-property dependent.
        interpolationFactor: zoomCurve instanceof Interpolate ?
            Interpolate.interpolationFactor.bind(undefined, zoomCurve.interpolation) :
            function () { return 0; },
        zoomStops: zoomCurve.labels
    };
}

module.exports.createExpression = createExpression;
module.exports.isExpression = isExpression;

// Zoom-dependent expressions may only use ["zoom"] as the input to a top-level "step" or "interpolate"
// expression (collectively referred to as a "curve"). The curve may be wrapped in one or more "let" or
// "coalesce" expressions.
function findZoomCurve(expression            )                                                           {
    if (expression instanceof Step || expression instanceof Interpolate) {
        var input = expression.input;
        if (input instanceof CompoundExpression && input.name === 'zoom') {
            return expression;
        } else {
            return null;
        }
    } else if (expression instanceof Let) {
        return findZoomCurve(expression.result);
    } else if (expression instanceof Coalesce) {
        var result = null;
        for (var i = 0, list = expression.args; i < list.length; i += 1) {
            var arg = list[i];

          var e = findZoomCurve(arg);
            if (!e) {
                continue;
            } else if (e.error) {
                return e;
            } else if ((e instanceof Step || e instanceof Interpolate) && !result) {
                result = e;
            } else {
                return {
                    key: e.key,
                    error: 'Only one zoom-based "step" or "interpolate" subexpression may be used in an expression.'
                };
            }
        }

        return result;
    } else {
        return null;
    }
}

var ref$1 = _dereq_('./types');
var ColorType = ref$1.ColorType;
var StringType = ref$1.StringType;
var NumberType = ref$1.NumberType;
var BooleanType = ref$1.BooleanType;
var ValueType = ref$1.ValueType;
var array = ref$1.array;

function getExpectedType(spec                            )              {
    var types = {
        color: ColorType,
        string: StringType,
        number: NumberType,
        enum: StringType,
        boolean: BooleanType
    };

    if (spec.type === 'array') {
        return array(types[spec.value] || ValueType, spec.length);
    }

    return types[spec.type] || null;
}

var ref$2 = _dereq_('../function');
var isFunction = ref$2.isFunction;
var ref$3 = _dereq_('./values');
var Color = ref$3.Color;

function getDefaultValue(spec                            )        {
    if (spec.type === 'color' && isFunction(spec.default)) {
        // Special case for heatmap-color: it uses the 'default:' to define a
        // default color ramp, but createExpression expects a simple value to fall
        // back to in case of runtime errors
        return new Color(0, 0, 0, 0);
    } else if (spec.type === 'color') {
        return Color.parse(spec.default) || null;
    } else if (spec.default === undefined) {
        return null;
    } else {
        return spec.default;
    }
}

},{"../function":33,"./compound_expression":5,"./definitions":13,"./definitions/coalesce":10,"./definitions/interpolate":14,"./definitions/let":15,"./definitions/step":18,"./evaluation_context":20,"./is_constant":22,"./parsing_context":23,"./parsing_error":24,"./types":28,"./values":29,"assert":undefined}],22:[function(_dereq_,module,exports){
'use strict';//      

var ref = _dereq_('./compound_expression');
var CompoundExpression = ref.CompoundExpression;

                                                  

function isFeatureConstant(e            ) {
    if (e instanceof CompoundExpression) {
        if (e.name === 'get' && e.args.length === 1) {
            return false;
        } else if (e.name === 'has' && e.args.length === 1) {
            return false;
        } else if (
            e.name === 'properties' ||
            e.name === 'geometry-type' ||
            e.name === 'id'
        ) {
            return false;
        }
    }

    var result = true;
    e.eachChild(function (arg) {
        if (result && !isFeatureConstant(arg)) { result = false; }
    });
    return result;
}

function isGlobalPropertyConstant(e            , properties               ) {
    if (e instanceof CompoundExpression && properties.indexOf(e.name) >= 0) { return false; }
    var result = true;
    e.eachChild(function (arg) {
        if (result && !isGlobalPropertyConstant(arg, properties)) { result = false; }
    });
    return result;
}

module.exports = {
    isFeatureConstant: isFeatureConstant,
    isGlobalPropertyConstant: isGlobalPropertyConstant,
};

},{"./compound_expression":5}],23:[function(_dereq_,module,exports){
'use strict';//      

var Scope = _dereq_('./scope');
var ref = _dereq_('./types');
var checkSubtype = ref.checkSubtype;
var ParsingError = _dereq_('./parsing_error');
var Literal = _dereq_('./definitions/literal');

                                             
                                  

/**
 * State associated parsing at a given point in an expression tree.
 * @private
 */
var ParsingContext = function ParsingContext(
    definitions   ,
    path,
    expectedType   ,
    scope,
    errors
) {
    if ( path === void 0 ) path            = [];
    if ( scope === void 0 ) scope    = new Scope();
    if ( errors === void 0 ) errors                  = [];

    this.definitions = definitions;
    this.path = path;
    this.key = path.map(function (part) { return ("[" + part + "]"); }).join('');
    this.scope = scope;
    this.errors = errors;
    this.expectedType = expectedType;
};

ParsingContext.prototype.parse = function parse (expr   , index     , expectedType    , bindings                          )          {
    var context = this;
    if (index) {
        context = context.concat(index, expectedType, bindings);
    }

    if (expr === null || typeof expr === 'string' || typeof expr === 'boolean' || typeof expr === 'number') {
        expr = ['literal', expr];
    }

    if (Array.isArray(expr)) {
        if (expr.length === 0) {
            return context.error("Expected an array with at least one element. If you wanted a literal array, use [\"literal\", []].");
        }

        var op = expr[0];
        if (typeof op !== 'string') {
            context.error(("Expression name must be a string, but found " + (typeof op) + " instead. If you wanted a literal array, use [\"literal\", [...]]."), 0);
            return null;
        }

        var Expr = context.definitions[op];
        if (Expr) {
            var parsed = Expr.parse(expr, context);
            if (!parsed) { return null; }
            var expected = context.expectedType;
            var actual = parsed.type;
            if (expected) {
                // When we expect a number, string, or boolean but have a
                // Value, wrap it in a refining assertion, and when we expect
                // a Color but have a String or Value, wrap it in "to-color"
                // coercion.
                var canAssert = expected.kind === 'string' ||
                    expected.kind === 'number' ||
                    expected.kind === 'boolean';

                if (canAssert && actual.kind === 'value') {
                    var Assertion = _dereq_('./definitions/assertion');
                    parsed = new Assertion(parsed.key, expected, [parsed]);
                } else if (expected.kind === 'color' && (actual.kind === 'value' || actual.kind === 'string')) {
                    var Coercion = _dereq_('./definitions/coercion');
                    parsed = new Coercion(parsed.key, expected, [parsed]);
                }

                if (context.checkSubtype(expected, parsed.type)) {
                    return null;
                }
            }

            // If an expression's arguments are all literals, we can evaluate
            // it immediately and replace it with a literal value in the
            // parsed/compiled result.
            if (!(parsed instanceof Literal) && isConstant(parsed)) {
                var ec = new (_dereq_('./evaluation_context'))();
                try {
                    parsed = new Literal(parsed.key, parsed.type, parsed.evaluate(ec));
                } catch (e) {
                    context.error(e.message);
                    return null;
                }
            }

            return parsed;
        }

        return context.error(("Unknown expression \"" + op + "\". If you wanted a literal array, use [\"literal\", [...]]."), 0);
    } else if (typeof expr === 'undefined') {
        return context.error("'undefined' value invalid. Use null instead.");
    } else if (typeof expr === 'object') {
        return context.error("Bare objects invalid. Use [\"literal\", {...}] instead.");
    } else {
        return context.error(("Expected an array, but found " + (typeof expr) + " instead."));
    }
};

/**
 * Returns a copy of this context suitable for parsing the subexpression at
 * index `index`, optionally appending to 'let' binding map.
 *
 * Note that `errors` property, intended for collecting errors while
 * parsing, is copied by reference rather than cloned.
 * @private
 */
ParsingContext.prototype.concat = function concat (index    , expectedType    , bindings                          ) {
    var path = typeof index === 'number' ? this.path.concat(index) : this.path;
    var scope = bindings ? this.scope.concat(bindings) : this.scope;
    return new ParsingContext(
        this.definitions,
        path,
        expectedType || null,
        scope,
        this.errors
    );
};

/**
 * Push a parsing (or type checking) error into the `this.errors`
 * @param error The message
 * @param keys Optionally specify the source of the error at a child
 * of the current expression at `this.key`.
 * @private
 */
ParsingContext.prototype.error = function error (error$1           ) {
        var keys = [], len = arguments.length - 1;
        while ( len-- > 0 ) keys[ len ] = arguments[ len + 1 ];

    var key = "" + (this.key) + (keys.map(function (k) { return ("[" + k + "]"); }).join(''));
    this.errors.push(new ParsingError(key, error$1));
};

/**
 * Returns null if `t` is a subtype of `expected`; otherwise returns an
 * error message and also pushes it to `this.errors`.
 */
ParsingContext.prototype.checkSubtype = function checkSubtype$1 (expected  , t  )      {
    var error = checkSubtype(expected, t);
    if (error) { this.error(error); }
    return error;
};

module.exports = ParsingContext;

function isConstant(expression            ) {
    // requires within function body to workaround circular dependency
    var ref = _dereq_('./compound_expression');
    var CompoundExpression = ref.CompoundExpression;
    var ref$1 = _dereq_('./is_constant');
    var isGlobalPropertyConstant = ref$1.isGlobalPropertyConstant;
    var isFeatureConstant = ref$1.isFeatureConstant;
    var Var = _dereq_('./definitions/var');

    if (expression instanceof Var) {
        return false;
    } else if (expression instanceof CompoundExpression && expression.name === 'error') {
        return false;
    }

    var literalArgs = true;
    expression.eachChild(function (arg) {
        if (!(arg instanceof Literal)) { literalArgs = false; }
    });
    if (!literalArgs) {
        return false;
    }

    return isFeatureConstant(expression) &&
        isGlobalPropertyConstant(expression, ['zoom', 'heatmap-density']);
}

},{"./compound_expression":5,"./definitions/assertion":7,"./definitions/coercion":11,"./definitions/literal":16,"./definitions/var":19,"./evaluation_context":20,"./is_constant":22,"./parsing_error":24,"./scope":26,"./types":28}],24:[function(_dereq_,module,exports){
'use strict';//      

var ParsingError = (function (Error) {
    function ParsingError(key        , message        ) {
        Error.call(this, message);
        this.message = message;
        this.key = key;
    }

    if ( Error ) ParsingError.__proto__ = Error;
    ParsingError.prototype = Object.create( Error && Error.prototype );
    ParsingError.prototype.constructor = ParsingError;

    return ParsingError;
}(Error));

module.exports = ParsingError;

},{}],25:[function(_dereq_,module,exports){
'use strict';//      

var RuntimeError = function RuntimeError(message    ) {
    this.name = 'ExpressionEvaluationError';
    this.message = message;
};

RuntimeError.prototype.toJSON = function toJSON () {
    return this.message;
};

module.exports = RuntimeError;

},{}],26:[function(_dereq_,module,exports){
'use strict';//      

                                             

/**
 * Tracks `let` bindings during expression parsing.
 * @private
 */
var Scope = function Scope(parent    , bindings) {
    var this$1 = this;
    if ( bindings === void 0 ) bindings                          = [];

    this.parent = parent;
    this.bindings = {};
    for (var i = 0, list = bindings; i < list.length; i += 1) {
        var ref = list[i];
        var name = ref[0];
        var expression = ref[1];

        this$1.bindings[name] = expression;
    }
};

Scope.prototype.concat = function concat (bindings                         ) {
    return new Scope(this, bindings);
};

Scope.prototype.get = function get (name    )         {
    if (this.bindings[name]) { return this.bindings[name]; }
    if (this.parent) { return this.parent.get(name); }
    throw new Error((name + " not found in scope."));
};

Scope.prototype.has = function has (name    )      {
    if (this.bindings[name]) { return true; }
    return this.parent ? this.parent.has(name) : false;
};

module.exports = Scope;

},{}],27:[function(_dereq_,module,exports){
'use strict';//      

                                               

                                                

/**
 * Returns the index of the last stop <= input, or 0 if it doesn't exist.
 * @private
 */
function findStopLessThanOrEqualTo(stops               , input        ) {
    var n = stops.length;
    var lowerIndex = 0;
    var upperIndex = n - 1;
    var currentIndex = 0;
    var currentValue, upperValue;

    while (lowerIndex <= upperIndex) {
        currentIndex = Math.floor((lowerIndex + upperIndex) / 2);
        currentValue = stops[currentIndex];
        upperValue = stops[currentIndex + 1];
        if (input === currentValue || input > currentValue && input < upperValue) { // Search complete
            return currentIndex;
        } else if (currentValue < input) {
            lowerIndex = currentIndex + 1;
        } else if (currentValue > input) {
            upperIndex = currentIndex - 1;
        }
    }

    return Math.max(currentIndex - 1, 0);
}

module.exports = {findStopLessThanOrEqualTo: findStopLessThanOrEqualTo};

},{}],28:[function(_dereq_,module,exports){
'use strict';//      

                                         
                                             
                                             
                                               
                                           
                                             
                                           
                                           

                  
               
                 
                 
                  
                
                 
                
                                                           
              

                         
                  
                   
              
 

var NullType = { kind: 'null' };
var NumberType = { kind: 'number' };
var StringType = { kind: 'string' };
var BooleanType = { kind: 'boolean' };
var ColorType = { kind: 'color' };
var ObjectType = { kind: 'object' };
var ValueType = { kind: 'value' };
var ErrorType = { kind: 'error' };

function array(itemType      , N         )            {
    return {
        kind: 'array',
        itemType: itemType,
        N: N
    };
}

function toString(type      )         {
    if (type.kind === 'array') {
        var itemType = toString(type.itemType);
        return typeof type.N === 'number' ?
            ("array<" + itemType + ", " + (type.N) + ">") :
            type.itemType.kind === 'value' ? 'array' : ("array<" + itemType + ">");
    } else {
        return type.kind;
    }
}

var valueMemberTypes = [
    NullType,
    NumberType,
    StringType,
    BooleanType,
    ColorType,
    ObjectType,
    array(ValueType)
];

/**
 * Returns null if `t` is a subtype of `expected`; otherwise returns an
 * error message.
 * @private
 */
function checkSubtype(expected      , t      )          {
    if (t.kind === 'error') {
        // Error is a subtype of every type
        return null;
    } else if (expected.kind === 'array') {
        if (t.kind === 'array' &&
            !checkSubtype(expected.itemType, t.itemType) &&
            (typeof expected.N !== 'number' || expected.N === t.N)) {
            return null;
        }
    } else if (expected.kind === t.kind) {
        return null;
    } else if (expected.kind === 'value') {
        for (var i = 0, list = valueMemberTypes; i < list.length; i += 1) {
            var memberType = list[i];

            if (!checkSubtype(memberType, t)) {
                return null;
            }
        }
    }

    return ("Expected " + (toString(expected)) + " but found " + (toString(t)) + " instead.");
}

module.exports = {
    NullType: NullType,
    NumberType: NumberType,
    StringType: StringType,
    BooleanType: BooleanType,
    ColorType: ColorType,
    ObjectType: ObjectType,
    ValueType: ValueType,
    array: array,
    ErrorType: ErrorType,
    toString: toString,
    checkSubtype: checkSubtype
};

},{}],29:[function(_dereq_,module,exports){
'use strict';//      

var assert = _dereq_('assert');
var Color = _dereq_('../util/color');

var ref = _dereq_('./types');
var NullType = ref.NullType;
var NumberType = ref.NumberType;
var StringType = ref.StringType;
var BooleanType = ref.BooleanType;
var ColorType = ref.ColorType;
var ObjectType = ref.ObjectType;
var ValueType = ref.ValueType;
var array = ref.array;

                                    

function validateRGBA(r       , g       , b       , a        )          {
    if (!(
        typeof r === 'number' && r >= 0 && r <= 255 &&
        typeof g === 'number' && g >= 0 && g <= 255 &&
        typeof b === 'number' && b >= 0 && b <= 255
    )) {
        var value = typeof a === 'number' ? [r, g, b, a] : [r, g, b];
        return ("Invalid rgba value [" + (value.join(', ')) + "]: 'r', 'g', and 'b' must be between 0 and 255.");
    }

    if (!(
        typeof a === 'undefined' || (typeof a === 'number' && a >= 0 && a <= 1)
    )) {
        return ("Invalid rgba value [" + ([r, g, b, a].join(', ')) + "]: 'a' must be between 0 and 1.");
    }

    return null;
}

                                                                                                 

function isValue(mixed       )          {
    if (mixed === null) {
        return true;
    } else if (typeof mixed === 'string') {
        return true;
    } else if (typeof mixed === 'boolean') {
        return true;
    } else if (typeof mixed === 'number') {
        return true;
    } else if (mixed instanceof Color) {
        return true;
    } else if (Array.isArray(mixed)) {
        for (var i = 0, list = mixed; i < list.length; i += 1) {
            var item = list[i];

            if (!isValue(item)) {
                return false;
            }
        }
        return true;
    } else if (typeof mixed === 'object') {
        for (var key in mixed) {
            if (!isValue(mixed[key])) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

function typeOf(value       )       {
    if (value === null) {
        return NullType;
    } else if (typeof value === 'string') {
        return StringType;
    } else if (typeof value === 'boolean') {
        return BooleanType;
    } else if (typeof value === 'number') {
        return NumberType;
    } else if (value instanceof Color) {
        return ColorType;
    } else if (Array.isArray(value)) {
        var length = value.length;
        var itemType       ;

        for (var i = 0, list = value; i < list.length; i += 1) {
            var item = list[i];

            var t = typeOf(item);
            if (!itemType) {
                itemType = t;
            } else if (itemType === t) {
                continue;
            } else {
                itemType = ValueType;
                break;
            }
        }

        return array(itemType || ValueType, length);
    } else {
        assert(typeof value === 'object');
        return ObjectType;
    }
}

module.exports = {
    Color: Color,
    validateRGBA: validateRGBA,
    isValue: isValue,
    typeOf: typeOf
};

},{"../util/color":42,"./types":28,"assert":undefined}],30:[function(_dereq_,module,exports){
'use strict';//      

var ref = _dereq_('../expression');
var createExpression = ref.createExpression;

                                                    
                                                                                                        

module.exports = createFilter;
module.exports.isExpressionFilter = isExpressionFilter;

function isExpressionFilter(filter) {
    if (!Array.isArray(filter) || filter.length === 0) {
        return false;
    }
    switch (filter[0]) {
    case 'has':
        return filter.length >= 2 && filter[1] !== '$id' && filter[1] !== '$type';

    case 'in':
    case '!in':
    case '!has':
    case 'none':
        return false;

    case '==':
    case '!=':
    case '>':
    case '>=':
    case '<':
    case '<=':
        return filter.length === 3 && (Array.isArray(filter[1]) || Array.isArray(filter[2]));

    case 'any':
    case 'all':
        for (var i = 0, list = filter.slice(1); i < list.length; i += 1) {
            var f = list[i];

        if (!isExpressionFilter(f) && typeof f !== 'boolean') {
                return false;
            }
        }
        return true;

    default:
        return true;
    }
}

var types = ['Unknown', 'Point', 'LineString', 'Polygon'];

var filterSpec = {
    'type': 'boolean',
    'default': false,
    'function': true,
    'property-function': true
};

/**
 * Given a filter expressed as nested arrays, return a new function
 * that evaluates whether a given feature (with a .properties or .tags property)
 * passes its test.
 *
 * @private
 * @param {Array} filter mapbox gl filter
 * @returns {Function} filter-evaluating function
 */
function createFilter(filter     )                {
    if (!filter) {
        return function () { return true; };
    }

    if (!isExpressionFilter(filter)) {
        return (new Function('g', 'f', ("var p = (f && f.properties || {}); return " + (compile(filter))))     );
    }

    var compiled = createExpression(filter, filterSpec, 'filter');
    if (compiled.result === 'success') {
        return compiled.evaluate;
    } else {
        throw new Error(compiled.errors.map(function (err) { return ((err.key) + ": " + (err.message)); }).join(', '));
    }
}

function compile(filter) {
    if (!filter) { return 'true'; }
    var op = filter[0];
    if (filter.length <= 1) { return op === 'any' ? 'false' : 'true'; }
    var str =
        op === '==' ? compileComparisonOp(filter[1], filter[2], '===', false) :
        op === '!=' ? compileComparisonOp(filter[1], filter[2], '!==', false) :
        op === '<' ||
        op === '>' ||
        op === '<=' ||
        op === '>=' ? compileComparisonOp(filter[1], filter[2], op, true) :
        op === 'any' ? compileLogicalOp(filter.slice(1), '||') :
        op === 'all' ? compileLogicalOp(filter.slice(1), '&&') :
        op === 'none' ? compileNegation(compileLogicalOp(filter.slice(1), '||')) :
        op === 'in' ? compileInOp(filter[1], filter.slice(2)) :
        op === '!in' ? compileNegation(compileInOp(filter[1], filter.slice(2))) :
        op === 'has' ? compileHasOp(filter[1]) :
        op === '!has' ? compileNegation(compileHasOp(filter[1])) :
        'true';
    return ("(" + str + ")");
}

function compilePropertyReference(property) {
    var ref =
        property === '$type' ? 'f.type' :
        property === '$id' ? 'f.id' : ("p[" + (JSON.stringify(property)) + "]");
    return ref;
}

function compileComparisonOp(property, value, op, checkType) {
    var left = compilePropertyReference(property);
    var right = property === '$type' ? types.indexOf(value) : JSON.stringify(value);
    return (checkType ? ("typeof " + left + "=== typeof " + right + "&&") : '') + left + op + right;
}

function compileLogicalOp(expressions, op) {
    return expressions.map(compile).join(op);
}

function compileInOp(property, values) {
    if (property === '$type') { values = values.map(function (value) {
        return types.indexOf(value);
    }); }
    var left = JSON.stringify(values.sort(compare));
    var right = compilePropertyReference(property);

    if (values.length <= 200) { return (left + ".indexOf(" + right + ") !== -1"); }

    return ("" + ('function(v, a, i, j) {' +
        'while (i <= j) { var m = (i + j) >> 1;' +
        '    if (a[m] === v) return true; if (a[m] > v) j = m - 1; else i = m + 1;' +
        '}' +
    'return false; }(') + right + ", " + left + ",0," + (values.length - 1) + ")");
}

function compileHasOp(property) {
    return property === '$id' ? '"id" in f' : ((JSON.stringify(property)) + " in p");
}

function compileNegation(expression) {
    return ("!(" + expression + ")");
}

// Comparison function to sort numbers and strings
function compare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

},{"../expression":21}],31:[function(_dereq_,module,exports){
'use strict';
var reference = _dereq_('./reference/latest.js');
var sortObject = _dereq_('sort-object');

function sameOrderAs(reference) {
    var keyOrder = {};

    Object.keys(reference).forEach(function (k, i) {
        keyOrder[k] = i + 1;
    });

    return {
        sort: function (a, b) {
            return (keyOrder[a] || Infinity) -
                   (keyOrder[b] || Infinity);
        }
    };
}

/**
 * Format a Mapbox GL Style.  Returns a stringified style with its keys
 * sorted in the same order as the reference style.
 *
 * The optional `space` argument is passed to
 * [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
 * to generate formatted output.
 *
 * If `space` is unspecified, a default of `2` spaces will be used.
 *
 * @private
 * @param {Object} style a Mapbox GL Style
 * @param {number} [space] space argument to pass to `JSON.stringify`
 * @returns {string} stringified formatted JSON
 * @example
 * var fs = require('fs');
 * var format = require('mapbox-gl-style-spec').format;
 * var style = fs.readFileSync('./source.json', 'utf8');
 * fs.writeFileSync('./dest.json', format(style));
 * fs.writeFileSync('./dest.min.json', format(style, 0));
 */
function format(style, space) {
    if (space === undefined) { space = 2; }
    style = sortObject(style, sameOrderAs(reference.$root));

    if (style.layers) {
        style.layers = style.layers.map(function (layer) {
            return sortObject(layer, sameOrderAs(reference.layer));
        });
    }

    return JSON.stringify(style, null, space);
}

module.exports = format;

},{"./reference/latest.js":37,"sort-object":undefined}],32:[function(_dereq_,module,exports){
'use strict';var assert = _dereq_('assert');
var extend = _dereq_('../util/extend');

module.exports = convertFunction;

function convertFunction(parameters, propertySpec, name) {
    var expression;

    parameters = extend({}, parameters);
    var defaultExpression;
    if (typeof parameters.default !== 'undefined') {
        defaultExpression = convertValue(parameters.default, propertySpec);
    } else {
        defaultExpression = convertValue(propertySpec.default, propertySpec);
        if (defaultExpression === null) {
            defaultExpression = ['error', 'No default property value available.'];
        }
    }

    if (parameters.stops) {
        var zoomAndFeatureDependent = parameters.stops && typeof parameters.stops[0][0] === 'object';
        var featureDependent = zoomAndFeatureDependent || parameters.property !== undefined;
        var zoomDependent = zoomAndFeatureDependent || !featureDependent;

        var stops = parameters.stops.map(function (stop) {
            return [stop[0], convertValue(stop[1], propertySpec)];
        });

        if (parameters.colorSpace && parameters.colorSpace !== 'rgb') {
            throw new Error('Unimplemented');
        }

        if (name === 'heatmap-color') {
            assert(zoomDependent);
            expression = convertZoomFunction(parameters, propertySpec, stops, ['heatmap-density']);
        } else if (zoomAndFeatureDependent) {
            expression = convertZoomAndPropertyFunction(parameters, propertySpec, stops, defaultExpression);
        } else if (zoomDependent) {
            expression = convertZoomFunction(parameters, propertySpec, stops);
        } else {
            expression = convertPropertyFunction(parameters, propertySpec, stops, defaultExpression);
        }
    } else {
        // identity function
        expression = convertIdentityFunction(parameters, propertySpec, defaultExpression);
    }

    return expression;
}

function convertIdentityFunction(parameters, propertySpec, defaultExpression) {
    var get = ['get', parameters.property];
    var type = propertySpec.type;

    if (type === 'color') {
        return parameters.default === undefined ? get : ['to-color', get, parameters.default];
    } else if (type === 'array' && typeof propertySpec.length === 'number') {
        return ['array', propertySpec.value, propertySpec.length, get];
    } else if (type === 'array') {
        return ['array', propertySpec.value, get];
    } else if (type === 'enum') {
        return [
            'let',
            'property_value', ['string', get],
            [
                'match',
                ['var', 'property_value'],
                Object.keys(propertySpec.values), ['var', 'property_value'],
                defaultExpression
            ]
        ];
    } else {
        return parameters.default === undefined ? get : [propertySpec.type, get, parameters.default];
    }
}

function convertValue(value, spec) {
    if (typeof value === 'undefined' || value === null) { return null; }
    if (spec.type === 'color') {
        return value;
    } else if (spec.type === 'array') {
        return ['literal', value];
    } else {
        return value;
    }
}

function convertZoomAndPropertyFunction(parameters, propertySpec, stops, defaultExpression) {
    var featureFunctionParameters = {};
    var featureFunctionStops = {};
    var zoomStops = [];
    for (var s = 0; s < stops.length; s++) {
        var stop = stops[s];
        var zoom = stop[0].zoom;
        if (featureFunctionParameters[zoom] === undefined) {
            featureFunctionParameters[zoom] = {
                zoom: zoom,
                type: parameters.type,
                property: parameters.property,
                default: parameters.default,
            };
            featureFunctionStops[zoom] = [];
            zoomStops.push(zoom);
        }
        featureFunctionStops[zoom].push([stop[0].value, stop[1]]);
    }

    // the interpolation type for the zoom dimension of a zoom-and-property
    // function is determined directly from the style property specification
    // for which it's being used: linear for interpolatable properties, step
    // otherwise.
    var functionType = getFunctionType({}, propertySpec);
    if (functionType === 'exponential') {
        var expression = ['interpolate', ['linear'], ['zoom']];

        for (var i = 0, list = zoomStops; i < list.length; i += 1) {
            var z = list[i];

            var output = convertPropertyFunction(featureFunctionParameters[z], propertySpec, featureFunctionStops[z], defaultExpression);
            appendStopPair(expression, z, output, false);
        }

        return expression;
    } else {
        var expression$1 = ['step', ['zoom']];

        for (var i$1 = 0, list$1 = zoomStops; i$1 < list$1.length; i$1 += 1) {
            var z$1 = list$1[i$1];

            var output$1 = convertPropertyFunction(featureFunctionParameters[z$1], propertySpec, featureFunctionStops[z$1], defaultExpression);
            appendStopPair(expression$1, z$1, output$1, true);
        }

        fixupDegenerateStepCurve(expression$1);

        return expression$1;
    }
}

function convertPropertyFunction(parameters, propertySpec, stops, defaultExpression) {
    var type = getFunctionType(parameters, propertySpec);

    var inputType = typeof stops[0][0];
    assert(
        inputType === 'string' ||
        inputType === 'number' ||
        inputType === 'boolean'
    );

    var input = [inputType, ['get', parameters.property]];

    var expression;
    var isStep = false;
    if (type === 'categorical' && inputType === 'boolean') {
        assert(parameters.stops.length > 0 && parameters.stops.length <= 2);
        if (parameters.stops[0][0] === false) {
            input = ['!', input];
        }
        expression = [ 'case', input, parameters.stops[0][1] ];
        if (parameters.stops.length > 1) {
            expression.push(parameters.stops[1][1]);
        } else {
            expression.push(defaultExpression);
        }
        return expression;
    } else if (type === 'categorical') {
        expression = ['match', input];
    } else if (type === 'interval') {
        expression = ['step', input];
        isStep = true;
    } else if (type === 'exponential') {
        var base = parameters.base !== undefined ? parameters.base : 1;
        expression = ['interpolate', ['exponential', base], input];
    } else {
        throw new Error(("Unknown property function type " + type));
    }

    for (var i = 0, list = stops; i < list.length; i += 1) {
        var stop = list[i];

        appendStopPair(expression, stop[0], stop[1], isStep);
    }

    if (expression[0] === 'match') {
        expression.push(defaultExpression);
    }

    fixupDegenerateStepCurve(expression);

    return expression;
}

function convertZoomFunction(parameters, propertySpec, stops, input) {
    if ( input === void 0 ) input = ['zoom'];

    var type = getFunctionType(parameters, propertySpec);
    var expression;
    var isStep = false;
    if (type === 'interval') {
        expression = ['step', input];
        isStep = true;
    } else if (type === 'exponential') {
        var base = parameters.base !== undefined ? parameters.base : 1;
        expression = ['interpolate', ['exponential', base], input];
    } else {
        throw new Error(("Unknown zoom function type \"" + type + "\""));
    }

    for (var i = 0, list = stops; i < list.length; i += 1) {
        var stop = list[i];

        appendStopPair(expression, stop[0], stop[1], isStep);
    }

    fixupDegenerateStepCurve(expression);

    return expression;
}

function fixupDegenerateStepCurve(expression) {
    // degenerate step curve (i.e. a constant function): add a noop stop
    if (expression[0] === 'step' && expression.length === 3) {
        expression.push(0);
        expression.push(expression[3]);
    }
}

function appendStopPair(curve, input, output, isStep) {
    // step curves don't get the first input value, as it is redundant.
    if (!(isStep && curve.length === 2)) {
        curve.push(input);
    }
    curve.push(output);
}

function getFunctionType (parameters, propertySpec) {
    if (parameters.type) {
        return parameters.type;
    } else if (propertySpec.function) {
        return propertySpec.function === 'interpolated' ? 'exponential' : 'interval';
    } else {
        return 'exponential';
    }
}

},{"../util/extend":44,"assert":undefined}],33:[function(_dereq_,module,exports){
'use strict';
var colorSpaces = _dereq_('../util/color_spaces');
var Color = _dereq_('../util/color');
var extend = _dereq_('../util/extend');
var getType = _dereq_('../util/get_type');
var interpolate = _dereq_('../util/interpolate');
var Interpolate = _dereq_('../expression/definitions/interpolate');

function isFunction(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function identityFunction(x) {
    return x;
}

function createFunction(parameters, propertySpec, name) {
    var isColor = propertySpec.type === 'color';
    var zoomAndFeatureDependent = parameters.stops && typeof parameters.stops[0][0] === 'object';
    var featureDependent = zoomAndFeatureDependent || parameters.property !== undefined;
    var zoomDependent = zoomAndFeatureDependent || !featureDependent;
    var type = parameters.type || (propertySpec.function === 'interpolated' ? 'exponential' : 'interval');

    if (isColor) {
        parameters = extend({}, parameters);

        if (parameters.stops) {
            parameters.stops = parameters.stops.map(function (stop) {
                return [stop[0], Color.parse(stop[1])];
            });
        }

        if (parameters.default) {
            parameters.default = Color.parse(parameters.default);
        } else {
            parameters.default = Color.parse(propertySpec.default);
        }
    }

    var innerFun;
    var hashedStops;
    var categoricalKeyType;
    if (type === 'exponential') {
        innerFun = evaluateExponentialFunction;
    } else if (type === 'interval') {
        innerFun = evaluateIntervalFunction;
    } else if (type === 'categorical') {
        innerFun = evaluateCategoricalFunction;

        // For categorical functions, generate an Object as a hashmap of the stops for fast searching
        hashedStops = Object.create(null);
        for (var i = 0, list = parameters.stops; i < list.length; i += 1) {
            var stop = list[i];

            hashedStops[stop[0]] = stop[1];
        }

        // Infer key type based on first stop key-- used to encforce strict type checking later
        categoricalKeyType = typeof parameters.stops[0][0];

    } else if (type === 'identity') {
        innerFun = evaluateIdentityFunction;
    } else {
        throw new Error(("Unknown function type \"" + type + "\""));
    }

    var outputFunction;

    // If we're interpolating colors in a color system other than RGBA,
    // first translate all stop values to that color system, then interpolate
    // arrays as usual. The `outputFunction` option lets us then translate
    // the result of that interpolation back into RGBA.
    if (parameters.colorSpace && parameters.colorSpace !== 'rgb') {
        if (colorSpaces[parameters.colorSpace]) {
            var colorspace = colorSpaces[parameters.colorSpace];
            // Avoid mutating the parameters value
            parameters = JSON.parse(JSON.stringify(parameters));
            for (var s = 0; s < parameters.stops.length; s++) {
                parameters.stops[s] = [
                    parameters.stops[s][0],
                    colorspace.forward(parameters.stops[s][1])
                ];
            }
            outputFunction = colorspace.reverse;
        } else {
            throw new Error(("Unknown color space: " + (parameters.colorSpace)));
        }
    } else {
        outputFunction = identityFunction;
    }

    if (zoomAndFeatureDependent) {
        var featureFunctions = {};
        var zoomStops = [];
        for (var s$1 = 0; s$1 < parameters.stops.length; s$1++) {
            var stop$1 = parameters.stops[s$1];
            var zoom = stop$1[0].zoom;
            if (featureFunctions[zoom] === undefined) {
                featureFunctions[zoom] = {
                    zoom: zoom,
                    type: parameters.type,
                    property: parameters.property,
                    default: parameters.default,
                    stops: []
                };
                zoomStops.push(zoom);
            }
            featureFunctions[zoom].stops.push([stop$1[0].value, stop$1[1]]);
        }

        var featureFunctionStops = [];
        for (var i$1 = 0, list$1 = zoomStops; i$1 < list$1.length; i$1 += 1) {
            var z = list$1[i$1];

            featureFunctionStops.push([featureFunctions[z].zoom, createFunction(featureFunctions[z], propertySpec)]);
        }

        return {
            isFeatureConstant: false,
            interpolationFactor: Interpolate.interpolationFactor.bind(undefined, {name: 'linear'}),
            zoomStops: featureFunctionStops.map(function (s) { return s[0]; }),
            evaluate: function evaluate(ref, properties) {
                var zoom = ref.zoom;

                return outputFunction(evaluateExponentialFunction({
                    stops: featureFunctionStops,
                    base: parameters.base
                }, propertySpec, zoom).evaluate(zoom, properties));
            }
        };
    } else if (zoomDependent) {
        var evaluate;
        if (name === 'heatmap-color') {
            evaluate = function (ref) {
                var heatmapDensity = ref.heatmapDensity;

                return outputFunction(innerFun(parameters, propertySpec, heatmapDensity, hashedStops, categoricalKeyType));
            };
        } else {
            evaluate = function (ref) {
                var zoom = ref.zoom;

                return outputFunction(innerFun(parameters, propertySpec, zoom, hashedStops, categoricalKeyType));
            };
        }
        return {
            isFeatureConstant: true,
            isZoomConstant: false,
            interpolationFactor: type === 'exponential' ?
                Interpolate.interpolationFactor.bind(undefined, {name: 'exponential', base: parameters.base !== undefined ? parameters.base : 1}) :
                function () { return 0; },
            zoomStops: parameters.stops.map(function (s) { return s[0]; }),
            evaluate: evaluate
        };
    } else {
        return {
            isFeatureConstant: false,
            isZoomConstant: true,
            evaluate: function evaluate(_, feature) {
                var value = feature && feature.properties ? feature.properties[parameters.property] : undefined;
                if (value === undefined) {
                    return coalesce(parameters.default, propertySpec.default);
                }
                return outputFunction(innerFun(parameters, propertySpec, value, hashedStops, categoricalKeyType));
            }
        };
    }
}

function coalesce(a, b, c) {
    if (a !== undefined) { return a; }
    if (b !== undefined) { return b; }
    if (c !== undefined) { return c; }
}

function evaluateCategoricalFunction(parameters, propertySpec, input, hashedStops, keyType) {
    var evaluated = typeof input === keyType ? hashedStops[input] : undefined; // Enforce strict typing on input
    return coalesce(evaluated, parameters.default, propertySpec.default);
}

function evaluateIntervalFunction(parameters, propertySpec, input) {
    // Edge cases
    if (getType(input) !== 'number') { return coalesce(parameters.default, propertySpec.default); }
    var n = parameters.stops.length;
    if (n === 1) { return parameters.stops[0][1]; }
    if (input <= parameters.stops[0][0]) { return parameters.stops[0][1]; }
    if (input >= parameters.stops[n - 1][0]) { return parameters.stops[n - 1][1]; }

    var index = findStopLessThanOrEqualTo(parameters.stops, input);

    return parameters.stops[index][1];
}

function evaluateExponentialFunction(parameters, propertySpec, input) {
    var base = parameters.base !== undefined ? parameters.base : 1;

    // Edge cases
    if (getType(input) !== 'number') { return coalesce(parameters.default, propertySpec.default); }
    var n = parameters.stops.length;
    if (n === 1) { return parameters.stops[0][1]; }
    if (input <= parameters.stops[0][0]) { return parameters.stops[0][1]; }
    if (input >= parameters.stops[n - 1][0]) { return parameters.stops[n - 1][1]; }

    var index = findStopLessThanOrEqualTo(parameters.stops, input);
    var t = interpolationFactor(
        input, base,
        parameters.stops[index][0],
        parameters.stops[index + 1][0]);

    var outputLower = parameters.stops[index][1];
    var outputUpper = parameters.stops[index + 1][1];
    var interp = interpolate[propertySpec.type] || identityFunction;

    if (typeof outputLower.evaluate === 'function') {
        return {
            evaluate: function evaluate() {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                var evaluatedLower = outputLower.evaluate.apply(undefined, args);
                var evaluatedUpper = outputUpper.evaluate.apply(undefined, args);
                // Special case for fill-outline-color, which has no spec default.
                if (evaluatedLower === undefined || evaluatedUpper === undefined) {
                    return undefined;
                }
                return interp(evaluatedLower, evaluatedUpper, t);
            }
        };
    }

    return interp(outputLower, outputUpper, t);
}

function evaluateIdentityFunction(parameters, propertySpec, input) {
    if (propertySpec.type === 'color') {
        input = Color.parse(input);
    } else if (getType(input) !== propertySpec.type && (propertySpec.type !== 'enum' || !propertySpec.values[input])) {
        input = undefined;
    }
    return coalesce(input, parameters.default, propertySpec.default);
}

/**
 * Returns the index of the last stop <= input, or 0 if it doesn't exist.
 *
 * @private
 */
function findStopLessThanOrEqualTo(stops, input) {
    var n = stops.length;
    var lowerIndex = 0;
    var upperIndex = n - 1;
    var currentIndex = 0;
    var currentValue, upperValue;

    while (lowerIndex <= upperIndex) {
        currentIndex = Math.floor((lowerIndex + upperIndex) / 2);
        currentValue = stops[currentIndex][0];
        upperValue = stops[currentIndex + 1][0];
        if (input === currentValue || input > currentValue && input < upperValue) { // Search complete
            return currentIndex;
        } else if (currentValue < input) {
            lowerIndex = currentIndex + 1;
        } else if (currentValue > input) {
            upperIndex = currentIndex - 1;
        }
    }

    return Math.max(currentIndex - 1, 0);
}

/**
 * Returns a ratio that can be used to interpolate between exponential function
 * stops.
 *
 * How it works:
 * Two consecutive stop values define a (scaled and shifted) exponential
 * function `f(x) = a * base^x + b`, where `base` is the user-specified base,
 * and `a` and `b` are constants affording sufficient degrees of freedom to fit
 * the function to the given stops.
 *
 * Here's a bit of algebra that lets us compute `f(x)` directly from the stop
 * values without explicitly solving for `a` and `b`:
 *
 * First stop value: `f(x0) = y0 = a * base^x0 + b`
 * Second stop value: `f(x1) = y1 = a * base^x1 + b`
 * => `y1 - y0 = a(base^x1 - base^x0)`
 * => `a = (y1 - y0)/(base^x1 - base^x0)`
 *
 * Desired value: `f(x) = y = a * base^x + b`
 * => `f(x) = y0 + a * (base^x - base^x0)`
 *
 * From the above, we can replace the `a` in `a * (base^x - base^x0)` and do a
 * little algebra:
 * ```
 * a * (base^x - base^x0) = (y1 - y0)/(base^x1 - base^x0) * (base^x - base^x0)
 *                     = (y1 - y0) * (base^x - base^x0) / (base^x1 - base^x0)
 * ```
 *
 * If we let `(base^x - base^x0) / (base^x1 base^x0)`, then we have
 * `f(x) = y0 + (y1 - y0) * ratio`.  In other words, `ratio` may be treated as
 * an interpolation factor between the two stops' output values.
 *
 * (Note: a slightly different form for `ratio`,
 * `(base^(x-x0) - 1) / (base^(x1-x0) - 1) `, is equivalent, but requires fewer
 * expensive `Math.pow()` operations.)
 *
 * @private
 */
function interpolationFactor(input, base, lowerValue, upperValue) {
    var difference = upperValue - lowerValue;
    var progress = input - lowerValue;

    if (difference === 0) {
        return 0;
    } else if (base === 1) {
        return progress / difference;
    } else {
        return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
    }
}

module.exports = {
    createFunction: createFunction,
    isFunction: isFunction
};

},{"../expression/definitions/interpolate":14,"../util/color":42,"../util/color_spaces":43,"../util/extend":44,"../util/get_type":45,"../util/interpolate":46}],34:[function(_dereq_,module,exports){
'use strict';
/**
 * Migrate a Mapbox GL Style to the latest version.
 *
 * @private
 * @alias migrate
 * @param {object} style a Mapbox GL Style
 * @returns {Object} a migrated style
 * @example
 * var fs = require('fs');
 * var migrate = require('mapbox-gl-style-spec').migrate;
 * var style = fs.readFileSync('./style.json', 'utf8');
 * fs.writeFileSync('./style.json', JSON.stringify(migrate(style)));
 */
module.exports = function(style) {
    var migrated = false;

    if (style.version === 6) {
        style = _dereq_('./migrate/v7')(style);
        migrated = true;
    }

    if (style.version === 7 || style.version === 8) {
        style = _dereq_('./migrate/v8')(style);
        migrated = true;
    }

    if (!migrated) {
        throw new Error('cannot migrate from', style.version);
    }

    return style;
};

},{"./migrate/v7":35,"./migrate/v8":36}],35:[function(_dereq_,module,exports){
'use strict';
var ref = _dereq_('../reference/v7.json');

function eachLayer(layer, callback) {
    for (var k in layer.layers) {
        callback(layer.layers[k]);
        eachLayer(layer.layers[k], callback);
    }
}

function eachPaint(layer, callback) {
    for (var k in layer) {
        if (k.indexOf('paint') === 0) {
            callback(layer[k], k);
        }
    }
}


// dash migrations are only safe to run once per style
var MIGRATE_DASHES = false;

var vec2props = {
    "fill-translate": true,
    "line-translate": true,
    "icon-offset": true,
    "text-offset": true,
    "icon-translate": true,
    "text-translate": true
};


module.exports = function(style) {
    style.version = 7;

    var processedConstants = {};

    eachLayer(style, function (layer) {

        var round = layer.layout && layer.layout['line-cap'] === 'round';

        eachPaint(layer, function (paint) {


            // split raster brightness
            if (paint['raster-brightness']) {
                var bval = paint['raster-brightness'];
                if (typeof bval === 'string') { bval = style.constants[bval]; }
                paint['raster-brightness-min'] = typeof bval[0] === 'string' ? style.constants[bval[0]] : bval[0];
                paint['raster-brightness-max'] = typeof bval[1] === 'string' ? style.constants[bval[1]] : bval[1];
                delete paint['raster-brightness'];
            }



            // Migrate vec2 prop functions
            for (var vec2prop in vec2props) {
                var val = paint[vec2prop];
                if (val && Array.isArray(val)) {
                    var s = val[0];
                    var t = val[1];

                    if (typeof s === 'string') {
                        s = style.constants[s];
                    }
                    if (typeof t === 'string') {
                        t = style.constants[t];
                    }

                    // not functions, nothing to migrate
                    if (s === undefined || t === undefined) { continue; }
                    if (!s.stops && !t.stops) { continue; }

                    var stopZooms = [];
                    var base = (void 0);
                    if (s.stops) {
                        for (var i = 0; i < s.stops.length; i++) {
                            stopZooms.push(s.stops[i][0]);
                        }
                        base = s.base;
                    }
                    if (t.stops) {
                        for (var k = 0; k < t.stops.length; k++) {
                            stopZooms.push(t.stops[k][0]);
                        }
                        base = base || t.base;
                    }
                    stopZooms.sort();

                    var fn = parseNumberArray([s, t]);

                    var newStops = [];
                    for (var h = 0; h < stopZooms.length; h++) {
                        var z = stopZooms[h];
                        if (z === stopZooms[h - 1]) { continue; }
                        newStops.push([z, fn(z)]);
                    }

                    paint[vec2prop] = { stops: newStops };
                    if (base) {
                        paint[vec2prop].base = base;
                    }
                }
            }



            if (paint['line-dasharray'] && MIGRATE_DASHES) {
                var w = paint['line-width'] ? paint['line-width'] : ref.class_line['line-width'].default;
                if (typeof w === 'string') { w = style.constants[w]; }

                var dasharray = paint['line-dasharray'];
                if (typeof dasharray === 'string') {
                    // don't process a constant more than once
                    if (processedConstants[dasharray]) { return; }
                    processedConstants[dasharray] = true;

                    dasharray = style.constants[dasharray];
                }

                if (typeof dasharray[0] === 'string') {
                    dasharray[0] = style.constants[dasharray[0]];
                }
                if (typeof dasharray[1] === 'string') {
                    dasharray[1] = style.constants[dasharray[1]];
                }

                var widthFn = parseNumber(w);
                var dashFn = parseNumberArray(dasharray);

                // since there is no perfect way to convert old functions,
                // just use the values at z17 to make the new value.
                var zoom = 17;

                var width = typeof widthFn === 'function' ? widthFn(zoom) : widthFn;
                var dash = dashFn(zoom);

                dash[0] /= width;
                dash[1] /= width;

                if (round) {
                    dash[0] -= 1;
                    dash[1] += 1;
                }

                if (typeof paint['line-dasharray'] === 'string') {
                    style.constants[paint['line-dasharray']] = dash;
                } else {
                    paint['line-dasharray'] = dash;
                }
            }
        });
    });

    style.layers = style.layers.filter(function (layer) {
        return !layer.layers;
    });

    return style;
};

// from mapbox-gl-js/src/style/style_declaration.js

function parseNumberArray(array) {
    var widths = array.map(parseNumber);

    return function(z) {
        var result = [];
        for (var i = 0; i < widths.length; i++) {
            result.push(typeof widths[i] === 'function' ? widths[i](z) : widths[i]);
        }
        return result;
    };
}


function parseNumber(num) {
    if (num.stops) { num = stopsFn(num); }
    var value = +num;
    return !isNaN(value) ? value : num;
}


function stopsFn(params) {
    var stops = params.stops;
    var base = params.base || ref.function.base.default;

    return function(z) {

        // find the two stops which the current z is between
        var low, high;

        for (var i = 0; i < stops.length; i++) {
            var stop = stops[i];
            if (stop[0] <= z) { low = stop; }
            if (stop[0] > z) {
                high = stop;
                break;
            }
        }

        if (low && high) {
            var zoomDiff = high[0] - low[0];
            var zoomProgress = z - low[0];
            var t = base === 1 ?
                zoomProgress / zoomDiff :
                (Math.pow(base, zoomProgress) - 1) / (Math.pow(base, zoomDiff) - 1);

            return interp(low[1], high[1], t);

        } else if (low) {
            return low[1];

        } else if (high) {
            return high[1];

        } else {
            return 1;
        }
    };
}

function interp(a, b, t) {
    return (a * (1 - t)) + (b * t);
}

},{"../reference/v7.json":39}],36:[function(_dereq_,module,exports){
'use strict';
var Reference = _dereq_('../reference/v8.json');
var URL = _dereq_('url');

function getPropertyReference(propertyName) {
    for (var i = 0; i < Reference.layout.length; i++) {
        for (var key in Reference[Reference.layout[i]]) {
            if (key === propertyName) { return Reference[Reference.layout[i]][key]; }
        }
    }
    for (var i$1 = 0; i$1 < Reference.paint.length; i$1++) {
        for (var key$1 in Reference[Reference.paint[i$1]]) {
            if (key$1 === propertyName) { return Reference[Reference.paint[i$1]][key$1]; }
        }
    }
}

function eachSource(style, callback) {
    for (var k in style.sources) {
        callback(style.sources[k]);
    }
}

function eachLayer(style, callback) {
    for (var k in style.layers) {
        callback(style.layers[k]);
        eachLayer(style.layers[k], callback);
    }
}

function eachLayout(layer, callback) {
    for (var k in layer) {
        if (k.indexOf('layout') === 0) {
            callback(layer[k], k);
        }
    }
}

function eachPaint(layer, callback) {
    for (var k in layer) {
        if (k.indexOf('paint') === 0) {
            callback(layer[k], k);
        }
    }
}

function resolveConstant(style, value) {
    if (typeof value === 'string' && value[0] === '@') {
        return resolveConstant(style, style.constants[value]);
    } else {
        return value;
    }
}

function eachProperty(style, options, callback) {
    if (arguments.length === 2) {
        callback = options;
        options = {};
    }

    options.layout = options.layout === undefined ? true : options.layout;
    options.paint = options.paint === undefined ? true : options.paint;

    function inner(layer, properties) {
        Object.keys(properties).forEach(function (key) {
            callback({
                key: key,
                value: properties[key],
                reference: getPropertyReference(key),
                set: function(x) {
                    properties[key] = x;
                }
            });
        });
    }

    eachLayer(style, function (layer) {
        if (options.paint) {
            eachPaint(layer, function (paint) {
                inner(layer, paint);
            });
        }
        if (options.layout) {
            eachLayout(layer, function (layout) {
                inner(layer, layout);
            });
        }
    });
}

function isFunction(value) {
    return Array.isArray(value.stops);
}

function renameProperty(obj, from, to) {
    obj[to] = obj[from]; delete obj[from];
}

module.exports = function(style) {
    style.version = 8;

    // Rename properties, reverse coordinates in source and layers
    eachSource(style, function (source) {
        if (source.type === 'video' && source.url !== undefined) {
            renameProperty(source, 'url', 'urls');
        }
        if (source.type === 'video') {
            source.coordinates.forEach(function (coord) {
                return coord.reverse();
            });
        }
    });

    eachLayer(style, function (layer) {
        eachLayout(layer, function (layout) {
            if (layout['symbol-min-distance'] !== undefined) {
                renameProperty(layout, 'symbol-min-distance', 'symbol-spacing');
            }
        });

        eachPaint(layer, function (paint) {
            if (paint['background-image'] !== undefined) {
                renameProperty(paint, 'background-image', 'background-pattern');
            }
            if (paint['line-image'] !== undefined) {
                renameProperty(paint, 'line-image', 'line-pattern');
            }
            if (paint['fill-image'] !== undefined) {
                renameProperty(paint, 'fill-image', 'fill-pattern');
            }
        });
    });

    // Inline Constants
    eachProperty(style, function (property) {
        var value = resolveConstant(style, property.value);

        if (isFunction(value)) {
            value.stops.forEach(function (stop) {
                stop[1] = resolveConstant(style, stop[1]);
            });
        }

        property.set(value);
    });
    delete style.constants;

    eachLayer(style, function (layer) {
        // get rid of text-max-size, icon-max-size
        // turn text-size, icon-size into layout properties
        // https://github.com/mapbox/mapbox-gl-style-spec/issues/255

        eachLayout(layer, function (layout) {
            delete layout['text-max-size'];
            delete layout['icon-max-size'];
        });

        eachPaint(layer, function (paint) {
            if (paint['text-size']) {
                if (!layer.layout) { layer.layout = {}; }
                layer.layout['text-size'] = paint['text-size'];
                delete paint['text-size'];
            }

            if (paint['icon-size']) {
                if (!layer.layout) { layer.layout = {}; }
                layer.layout['icon-size'] = paint['icon-size'];
                delete paint['icon-size'];
            }
        });
    });

    function migrateFontstackURL(input) {
        var inputParsed = URL.parse(input);
        var inputPathnameParts = inputParsed.pathname.split('/');

        if (inputParsed.protocol !== 'mapbox:') {
            return input;

        } else if (inputParsed.hostname === 'fontstack') {
            assert(decodeURI(inputParsed.pathname) === '/{fontstack}/{range}.pbf');
            return 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf';

        } else if (inputParsed.hostname === 'fonts') {
            assert(inputPathnameParts[1] === 'v1');
            assert(decodeURI(inputPathnameParts[3]) === '{fontstack}');
            assert(decodeURI(inputPathnameParts[4]) === '{range}.pbf');
            return ("mapbox://fonts/" + (inputPathnameParts[2]) + "/{fontstack}/{range}.pbf");

        } else {
            assert(false);
        }

        function assert(predicate) {
            if (!predicate) {
                throw new Error(("Invalid font url: \"" + input + "\""));
            }
        }
    }

    if (style.glyphs) {
        style.glyphs = migrateFontstackURL(style.glyphs);
    }

    function migrateFontStack(font) {
        function splitAndTrim(string) {
            return string.split(',').map(function (s) {
                return s.trim();
            });
        }

        if (Array.isArray(font)) {
            // Assume it's a previously migrated font-array.
            return font;

        } else if (typeof font === 'string') {
            return splitAndTrim(font);

        } else if (typeof font === 'object') {
            font.stops.forEach(function (stop) {
                stop[1] = splitAndTrim(stop[1]);
            });
            return font;

        } else {
            throw new Error("unexpected font value");
        }
    }

    eachLayer(style, function (layer) {
        eachLayout(layer, function (layout) {
            if (layout['text-font']) {
                layout['text-font'] = migrateFontStack(layout['text-font']);
            }
        });
    });

    // Reverse order of symbol layers. This is an imperfect migration.
    //
    // The order of a symbol layer in the layers list affects two things:
    // - how it is drawn relative to other layers (like oneway arrows below bridges)
    // - the placement priority compared to other layers
    //
    // It's impossible to reverse the placement priority without breaking the draw order
    // in some cases. This migration only reverses the order of symbol layers that
    // are above all other types of layers.
    //
    // Symbol layers that are at the top of the map preserve their priority.
    // Symbol layers that are below another type (line, fill) of layer preserve their draw order.

    var firstSymbolLayer = 0;
    for (var i = style.layers.length - 1; i >= 0; i--) {
        var layer = style.layers[i];
        if (layer.type !== 'symbol') {
            firstSymbolLayer = i + 1;
            break;
        }
    }

    var symbolLayers = style.layers.splice(firstSymbolLayer);
    symbolLayers.reverse();
    style.layers = style.layers.concat(symbolLayers);

    return style;
};

},{"../reference/v8.json":40,"url":undefined}],37:[function(_dereq_,module,exports){
'use strict';
module.exports = _dereq_('./v8.json');

},{"./v8.json":40}],38:[function(_dereq_,module,exports){
module.exports={
  "$version": 6,
  "$root": {
    "version": {
      "required": true,
      "type": "enum",
      "values": [
        6
      ],
      "doc": "Stylesheet version number. Must be 6."
    },
    "constants": {
      "type": "constants",
      "doc": "An object of constants to be referenced in layers."
    },
    "sources": {
      "required": true,
      "type": "sources",
      "doc": "Data source specifications."
    },
    "sprite": {
      "type": "string",
      "doc": "A base URL for retrieving the sprite image and metadata. The extensions `.png`, `.json` and scale factor `@2x.png` will be automatically appended."
    },
    "glyphs": {
      "type": "string",
      "doc": "A URL template for loading signed-distance-field glyph sets in PBF format. Valid tokens are {fontstack} and {range}."
    },
    "transition": {
      "type": "transition",
      "doc": "A global transition definition to use as a default across properties."
    },
    "layers": {
      "required": true,
      "type": "array",
      "value": "layer",
      "doc": "Layers will be drawn in the order of this array."
    }
  },
  "constants": {
    "*": {
      "type": "*",
      "doc": "A constant that will be replaced verbatim in the referencing place. This can be anything, including objects and arrays. All variable names must be prefixed with an `@` symbol."
    }
  },
  "sources": {
    "*": {
      "type": "source",
      "doc": "Specification of a data source. For vector and raster sources, either TileJSON or a URL to a TileJSON must be provided. For GeoJSON and video sources, a URL must be provided."
    }
  },
  "source": [
    "source_tile",
    "source_geojson",
    "source_video"
  ],
  "source_tile": {
    "type": {
      "required": true,
      "type": "enum",
      "values": [
        "vector",
        "raster"
      ],
      "doc": "The data type of the source."
    },
    "url": {
      "type": "string",
      "doc": "A URL to a TileJSON resource. Supported protocols are `http:`, `https:`, and `mapbox://<mapid>`."
    },
    "tiles": {
      "type": "array",
      "value": "string",
      "doc": "An array of one or more tile source URLs, as in the TileJSON spec."
    },
    "minzoom": {
      "type": "number",
      "default": 0,
      "doc": "Minimum zoom level for which tiles are available, as in the TileJSON spec."
    },
    "maxzoom": {
      "type": "number",
      "default": 22,
      "doc": "Maximum zoom level for which tiles are available, as in the TileJSON spec. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels."
    },
    "tileSize": {
      "type": "number",
      "default": 512,
      "units": "pixels",
      "doc": "The minimum visual size to display tiles for this layer. Only configurable for raster layers."
    },
    "*": {
      "type": "*",
      "doc": "Other keys to configure the data source."
    }
  },
  "source_geojson": {
    "type": {
      "required": true,
      "type": "enum",
      "values": [
        "geojson"
      ]
    },
    "data": {
      "type": "*"
    }
  },
  "source_video": {
    "type": {
      "required": true,
      "type": "enum",
      "values": [
        "video"
      ]
    },
    "url": {
      "required": true,
      "type": "array",
      "value": "string",
      "doc": "URLs to video content in order of preferred format."
    },
    "coordinates": {
      "required": true,
      "type": "array",
      "length": 4,
      "value": {
        "type": "array",
        "length": 2,
        "value": "number"
      }
    }
  },
  "layer": {
    "id": {
      "type": "string",
      "doc": "Unique layer name."
    },
    "type": {
      "type": "enum",
      "values": [
        "fill",
        "line",
        "symbol",
        "raster",
        "background"
      ],
      "doc": "Rendering type of this layer."
    },
    "ref": {
      "type": "string",
      "doc": "References another layer to copy `type`, `source`, `source-layer`, `minzoom`, `maxzoom`, `filter`, and `layout` properties from. This allows the layers to share processing and be more efficient."
    },
    "source": {
      "type": "string",
      "doc": "Name of a source description to be used for this layer."
    },
    "source-layer": {
      "type": "string",
      "doc": "Layer to use from a vector tile source. Required if the source supports multiple layers."
    },
    "minzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 22,
      "doc": "The minimum zoom level on which the layer gets parsed and appears on."
    },
    "maxzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 22,
      "doc": "The maximum zoom level on which the layer gets parsed and appears on."
    },
    "interactive": {
      "type": "boolean",
      "doc": "Enable querying of feature data from this layer for interactivity.",
      "default": false
    },
    "filter": {
      "type": "filter",
      "doc": "A expression specifying conditions on source features. Only features that match the filter are displayed."
    },
    "layers": {
      "type": "array",
      "value": "layer",
      "doc": "If `type` is `raster`, the child layers are composited together onto the previous level layer level."
    },
    "layout": {
      "type": "layout",
      "doc": "Layout properties for the layer."
    },
    "paint": {
      "type": "paint",
      "doc": "Default paint properties for this layer."
    },
    "paint.*": {
      "type": "paint",
      "doc": "Class-specific paint properties for this layer. The class name is the part after the first dot."
    }
  },
  "layout": [
    "layout_fill",
    "layout_line",
    "layout_symbol",
    "layout_raster",
    "layout_background"
  ],
  "layout_background": {
  },
  "layout_fill": {
  },
  "layout_line": {
    "line-cap": {
      "type": "enum",
      "values": [
        "butt",
        "round",
        "square"
      ],
      "default": "butt",
      "doc": "The display of line endings."
    },
    "line-join": {
      "type": "enum",
      "values": [
        "bevel",
        "round",
        "miter"
      ],
      "default": "miter",
      "doc": "The display of lines when joining."
    },
    "line-miter-limit": {
      "type": "number",
      "default": 2,
      "doc": "Used to automatically convert miter joins to bevel joins for sharp angles.",
      "requires": [
        {
          "line-join": "miter"
        }
      ]
    },
    "line-round-limit": {
      "type": "number",
      "default": 1,
      "doc": "Used to automatically convert round joins to miter joins for shallow angles.",
      "requires": [
        {
          "line-join": "round"
        }
      ]
    }
  },
  "layout_symbol": {
    "symbol-placement": {
      "type": "enum",
      "values": [
          "point",
          "line"
      ],
      "default": "point",
      "doc": "Label placement relative to its geometry. `line` can only be used on LineStrings and Polygons."
    },
    "symbol-min-distance": {
      "type": "number",
      "default": 250,
      "minimum": 1,
      "units": "pixels",
      "doc": "Minimum distance between two symbol anchors.",
      "requires": [
        {
          "symbol-placement": "line"
        }
      ]
    },
    "symbol-avoid-edges": {
      "type": "boolean",
      "default": false,
      "doc": "If true, the symbols will not cross tile edges to avoid mutual collisions. Recommended in layers that don't have enough padding in the vector tile to prevent collisions, or if it is a point symbol layer placed after a line symbol layer."
    },
    "icon-allow-overlap": {
      "type": "boolean",
      "default": false,
      "doc": "If true, the icon will be visible even if it collides with other icons and text.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-ignore-placement": {
      "type": "boolean",
      "default": false,
      "doc": "If true, the icon won't affect placement of other icons and text.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-optional": {
      "type": "boolean",
      "default": false,
      "doc": "If true, text can be shown without its corresponding icon.",
      "requires": [
        "icon-image",
        "text-field"
      ]
    },
    "icon-rotation-alignment": {
      "type": "enum",
      "values": [
        "map",
        "viewport"
      ],
      "default": "viewport",
      "doc": "Orientation of icon when map is rotated.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-max-size": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "doc": "The maximum factor to scale the icon.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-image": {
      "type": "string",
      "doc": "A string with {tokens} replaced, referencing the data property to pull from.",
      "tokens": true
    },
    "icon-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "units": "degrees",
      "doc": "Rotates the icon clockwise.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "units": "pixels",
      "doc": "Padding value around icon bounding box to avoid icon collisions.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-keep-upright": {
      "type": "boolean",
      "default": false,
      "doc": "If true, the icon may be flipped to prevent it from being rendered upside-down",
      "requires": [
        "icon-image",
        {
          "icon-rotation-alignment": "map"
        }
      ]
    },
    "icon-offset": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "doc": "Icon's offset distance. Values are [x, y] where negatives indicate left and up, respectively.",
      "requires": [
        "icon-image"
      ]
    },
    "text-rotation-alignment": {
      "type": "enum",
      "values": [
        "map",
        "viewport"
      ],
      "default": "viewport",
      "doc": "Orientation of icon or text when map is rotated.",
      "requires": [
        "text-field"
      ]
    },
    "text-field": {
      "type": "string",
      "default": "",
      "tokens": true,
      "doc": "Value to use for a text label. Feature properties are specified using tokens like {field_name}."
    },
    "text-font": {
      "type": "string",
      "default": "Open Sans Regular, Arial Unicode MS Regular",
      "doc": "Font stack to use for displaying text.",
      "requires": [
        "text-field"
      ]
    },
    "text-max-size": {
      "type": "number",
      "default": 16,
      "minimum": 0,
      "units": "pixels",
      "doc": "The maximum size text will be laid out, to calculate collisions with.",
      "requires": [
        "text-field"
      ]
    },
    "text-max-width": {
      "type": "number",
      "default": 15,
      "minimum": 0,
      "units": "em",
      "doc": "The maximum line width for text wrapping.",
      "requires": [
        "text-field"
      ]
    },
    "text-line-height": {
      "type": "number",
      "default": 1.2,
      "units": "em",
      "doc": "Text leading value for multi-line text.",
      "requires": [
        "text-field"
      ]
    },
    "text-letter-spacing": {
      "type": "number",
      "default": 0,
      "units": "em",
      "doc": "Text kerning value.",
      "requires": [
        "text-field"
      ]
    },
    "text-justify": {
      "type": "enum",
      "values": [
        "left",
        "center",
        "right"
      ],
      "default": "center",
      "doc": "Text justification options.",
      "requires": [
        "text-field"
      ]
    },
    "text-anchor": {
      "type": "enum",
      "values": [
        "center",
        "left",
        "right",
        "top",
        "bottom",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right"
      ],
      "default": "center",
      "doc": "Which part of the text to place closest to the anchor.",
      "requires": [
        "text-field"
      ]
    },
    "text-max-angle": {
      "type": "number",
      "default": 45,
      "units": "degrees",
      "doc": "Maximum angle change between adjacent characters.",
      "requires": [
        "text-field",
        {
          "symbol-placement": "line"
        }
      ]
    },
    "text-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "units": "degrees",
      "doc": "Rotates the text clockwise.",
      "requires": [
        "text-field"
      ]
    },
    "text-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "units": "pixels",
      "doc": "Padding value around text bounding box to avoid label collisions.",
      "requires": [
        "text-field"
      ]
    },
    "text-keep-upright": {
      "type": "boolean",
      "default": true,
      "doc": "If true, the text may be flipped vertically to prevent it from being rendered upside-down.",
      "requires": [
        "text-field",
        {
          "text-rotation-alignment": "map"
        }
      ]
    },
    "text-transform": {
      "type": "enum",
      "values": [
        "none",
        "uppercase",
        "lowercase"
      ],
      "default": "none",
      "doc": "Specifies how to capitalize text, similar to the CSS `text-transform` property.",
      "requires": [
        "text-field"
      ]
    },
    "text-offset": {
      "type": "array",
      "doc": "Specifies the distance that text is offset from its anchor horizontally and vertically.",
      "value": "number",
      "units": "ems",
      "length": 2,
      "default": [
        0,
        0
      ],
      "requires": [
        "text-field"
      ]
    },
    "text-allow-overlap": {
      "type": "boolean",
      "default": false,
      "doc": "If true, the text will be visible even if it collides with other icons and labels.",
      "requires": [
        "text-field"
      ]
    },
    "text-ignore-placement": {
      "type": "boolean",
      "default": false,
      "doc": "If true, the text won't affect placement of other icons and labels.",
      "requires": [
        "text-field"
      ]
    },
    "text-optional": {
      "type": "boolean",
      "default": false,
      "doc": "If true, icons can be shown without their corresponding text.",
      "requires": [
        "text-field",
        "icon-image"
      ]
    }
  },
  "layout_raster": {
    "raster-size": {
      "type": "number",
      "default": 256,
      "minimum": 0,
      "maximum": 3855,
      "units": "pixels",
      "doc": "The texture image size at which vector layers will be rasterized. Will scale to match the visual tile size."
    },
    "raster-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "units": "pixels",
      "doc": "Blur radius applied to the raster texture before display."
    }
  },
  "filter": {
    "type": "array",
    "value": "*"
  },
  "filter_operator": {
    "type": "enum",
    "values": [
      "==",
      "!=",
      ">",
      ">=",
      "<",
      "<=",
      "in",
      "!in",
      "all",
      "any",
      "none"
    ]
  },
  "geometry_type": {
    "type": "enum",
    "values": [
      "Point",
      "LineString",
      "Polygon"
    ]
  },
  "function": {
    "stops": {
      "type": "array",
      "required": true,
      "doc": "An array of stops.",
      "value": "function_stop"
    },
    "base": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "doc": "The exponential base of the interpolation curve. It controls the rate at which the result increases. Higher values make the result increase more towards the high end of the range. With `1` the stops are interpolated linearly."
    }
  },
  "function_stop": {
    "type": "array",
    "minimum": 0,
    "maximum": 22,
    "value": [
      "number",
      "color"
    ],
    "length": 2,
    "doc": "Zoom level and value pair."
  },
  "paint": [
    "paint_fill",
    "paint_line",
    "paint_symbol",
    "paint_raster",
    "paint_background"
  ],
  "paint_fill": {
    "fill-antialias": {
      "type": "boolean",
      "default": true,
      "function": true,
      "doc": "Whether or not the fill should be antialiased."
    },
    "fill-opacity": {
      "type": "number",
      "function": true,
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity given to the fill color.",
      "transition": true
    },
    "fill-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color of the fill.",
      "function": true,
      "transition": true,
      "requires": [
        {
          "!": "fill-image"
        }
      ]
    },
    "fill-outline-color": {
      "type": "color",
      "doc": "The outline color of the fill. Matches the value of `fill-color` if unspecified.",
      "function": true,
      "transition": true,
      "requires": [
        {
          "!": "fill-image"
        },
        {
          "fill-antialias": true
        }
      ]
    },
    "fill-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively."
    },
    "fill-translate-anchor": {
      "type": "enum",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "fill-translate"
      ]
    },
    "fill-image": {
      "type": "string",
      "doc": "Name of image in sprite to use for drawing image fills."
    }
  },
  "paint_line": {
    "line-opacity": {
      "type": "number",
      "doc": "The opacity at which the line will be drawn.",
      "function": true,
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true
    },
    "line-color": {
      "type": "color",
      "doc": "The color with which the line will be drawn.",
      "default": "#000000",
      "function": true,
      "transition": true,
      "requires": [
        {
          "!": "line-image"
        }
      ]
    },
    "line-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively."
    },
    "line-translate-anchor": {
      "type": "enum",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "line-translate"
      ]
    },
    "line-width": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Stroke thickness."
    },
    "line-gap-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "doc": "Draws a line casing outside of a line's actual path. Value indicates the width of the inner gap.",
      "function": true,
      "transition": true,
      "units": "pixels"
    },
    "line-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Blur applied to the line, in pixels."
    },
    "line-dasharray": {
      "type": "array",
      "value": "number",
      "doc": "Specifies the size and gap between dashes in a line.",
      "length": 2,
      "default": [
        1,
        -1
      ],
      "minimum": 0,
      "function": true,
      "transition": true,
      "requires": [
        {
          "!": "line-image"
        }
      ]
    },
    "line-image": {
      "type": "string",
      "doc": "Name of image in sprite to use for drawing image lines."
    }
  },
  "paint_symbol": {
    "icon-opacity": {
      "doc": "The opacity at which the icon will be drawn.",
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": true,
      "transition": true,
      "requires": [
        "icon-image"
      ]
    },
    "icon-size": {
      "type": "number",
      "default": 1,
      "function": true,
      "transition": true,
      "doc": "Scale factor for icon. 1 is original size, 3 triples the size.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-color": {
      "type": "color",
      "default": "#000000",
      "function": true,
      "transition": true,
      "doc": "The color of the icon. This can only be used with sdf icons.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": true,
      "transition": true,
      "doc": "The color of the icon's halo. Icon halos can only be used with sdf icons.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the icon outline.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Fade out the halo towards the outside.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "An icon's offset distance. Values are [x, y] where negatives indicate left and up, respectively.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-translate-anchor": {
      "type": "enum",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "icon-image",
        "icon-translate"
      ]
    },
    "text-opacity": {
      "type": "number",
      "doc": "The opacity at which the text will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": true,
      "transition": true,
      "requires": [
        "text-field"
      ]
    },
    "text-size": {
      "type": "number",
      "default": 16,
      "minimum": 0,
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Font size. If unspecified, the text will be as big as allowed by the layer definition.",
      "requires": [
        "text-field"
      ]
    },
    "text-color": {
      "type": "color",
      "doc": "The color with which the text will be drawn.",
      "default": "#000000",
      "function": true,
      "transition": true,
      "requires": [
        "text-field"
      ]
    },
    "text-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": true,
      "transition": true,
      "doc": "The color of the text's halo, which helps it stand out from backgrounds.",
      "requires": [
        "text-field"
      ]
    },
    "text-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the font outline. Max text halo width is 1/4 of the font-size.",
      "requires": [
        "text-field"
      ]
    },
    "text-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The halo's fadeout distance towards the outside.",
      "requires": [
        "text-field"
      ]
    },
    "text-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Label offset. Values are [x, y] where negatives indicate left and up, respectively.",
      "requires": [
        "text-field"
      ]
    },
    "text-translate-anchor": {
      "type": "enum",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "text-field",
        "text-translate"
      ]
    }
  },
  "paint_raster": {
    "raster-opacity": {
      "type": "number",
      "doc": "The opacity at which the image will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true
    },
    "raster-hue-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "function": true,
      "transition": true,
      "units": "degrees",
      "doc": "Rotates hues around the color wheel."
    },
    "raster-brightness": {
      "type": "array",
      "value": "number",
      "doc": "Increase or reduce the brightness of the image. First value is the minimum, second is the maximum brightness.",
      "length": 2,
      "default": [
        0,
        1
      ],
      "function": true,
      "transition": true
    },
    "raster-saturation": {
      "type": "number",
      "doc": "Increase or reduce the saturation of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": true,
      "transition": true
    },
    "raster-contrast": {
      "type": "number",
      "doc": "Increase or reduce the contrast of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": true,
      "transition": true
    },
    "raster-fade-duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "function": true,
      "transition": true,
      "units": "milliseconds",
      "doc": "Fade duration when a new tile is added."
    }
  },
  "paint_background": {
    "background-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color with which the background will be drawn.",
      "function": true,
      "transition": true,
      "requires": [
        {
          "!": "background-image"
        }
      ]
    },
    "background-image": {
      "type": "string",
      "doc": "Optionally an image which is drawn as the background."
    },
    "background-opacity": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity at which the background will be drawn.",
      "function": true,
      "transition": true
    }
  },
  "transition": {
    "duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Time allotted for transitions to complete."
    },
    "delay": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Length of time before a transition begins."
    }
  }
}

},{}],39:[function(_dereq_,module,exports){
module.exports={
  "$version": 7,
  "$root": {
    "version": {
      "required": true,
      "type": "enum",
      "values": [
        7
      ],
      "doc": "Stylesheet version number. Must be 7."
    },
    "name": {
      "type": "string",
      "doc": "A human-readable name for the style."
    },
    "constants": {
      "type": "constants",
      "doc": "An object of constants to be referenced in layers."
    },
    "sources": {
      "required": true,
      "type": "sources",
      "doc": "Data source specifications."
    },
    "sprite": {
      "type": "string",
      "doc": "A base URL for retrieving the sprite image and metadata. The extensions `.png`, `.json` and scale factor `@2x.png` will be automatically appended."
    },
    "glyphs": {
      "type": "string",
      "doc": "A URL template for loading signed-distance-field glyph sets in PBF format. Valid tokens are {fontstack} and {range}."
    },
    "transition": {
      "type": "transition",
      "doc": "A global transition definition to use as a default across properties."
    },
    "layers": {
      "required": true,
      "type": "array",
      "value": "layer",
      "doc": "Layers will be drawn in the order of this array."
    }
  },
  "constants": {
    "*": {
      "type": "*",
      "doc": "A constant that will be replaced verbatim in the referencing place. This can be anything, including objects and arrays. All variable names must be prefixed with an `@` symbol."
    }
  },
  "sources": {
    "*": {
      "type": "source",
      "doc": "Specification of a data source. For vector and raster sources, either TileJSON or a URL to a TileJSON must be provided. For GeoJSON and video sources, a URL must be provided."
    }
  },
  "source": [
    "source_tile",
    "source_geojson",
    "source_video"
  ],
  "source_tile": {
    "type": {
      "required": true,
      "type": "enum",
      "values": [
        "vector",
        "raster"
      ],
      "doc": "The data type of the source."
    },
    "url": {
      "type": "string",
      "doc": "A URL to a TileJSON resource. Supported protocols are `http:`, `https:`, and `mapbox://<mapid>`."
    },
    "tiles": {
      "type": "array",
      "value": "string",
      "doc": "An array of one or more tile source URLs, as in the TileJSON spec."
    },
    "minzoom": {
      "type": "number",
      "default": 0,
      "doc": "Minimum zoom level for which tiles are available, as in the TileJSON spec."
    },
    "maxzoom": {
      "type": "number",
      "default": 22,
      "doc": "Maximum zoom level for which tiles are available, as in the TileJSON spec. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels."
    },
    "tileSize": {
      "type": "number",
      "default": 512,
      "units": "pixels",
      "doc": "The minimum visual size to display tiles for this layer. Only configurable for raster layers."
    },
    "*": {
      "type": "*",
      "doc": "Other keys to configure the data source."
    }
  },
  "source_geojson": {
    "type": {
      "required": true,
      "type": "enum",
      "values": [
        "geojson"
      ]
    },
    "data": {
      "type": "*"
    }
  },
  "source_video": {
    "type": {
      "required": true,
      "type": "enum",
      "values": [
        "video"
      ]
    },
    "url": {
      "required": true,
      "type": "array",
      "value": "string",
      "doc": "URLs to video content in order of preferred format."
    },
    "coordinates": {
      "required": true,
      "type": "array",
      "length": 4,
      "value": {
        "type": "array",
        "length": 2,
        "value": "number"
      }
    }
  },
  "layer": {
    "id": {
      "type": "string",
      "doc": "Unique layer name."
    },
    "type": {
      "type": "enum",
      "values": [
        "fill",
        "line",
        "symbol",
        "raster",
        "background"
      ],
      "doc": "Rendering type of this layer."
    },
    "ref": {
      "type": "string",
      "doc": "References another layer to copy `type`, `source`, `source-layer`, `minzoom`, `maxzoom`, `filter`, and `layout` properties from. This allows the layers to share processing and be more efficient."
    },
    "source": {
      "type": "string",
      "doc": "Name of a source description to be used for this layer."
    },
    "source-layer": {
      "type": "string",
      "doc": "Layer to use from a vector tile source. Required if the source supports multiple layers."
    },
    "minzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 22,
      "doc": "The minimum zoom level on which the layer gets parsed and appears on."
    },
    "maxzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 22,
      "doc": "The maximum zoom level on which the layer gets parsed and appears on."
    },
    "interactive": {
      "type": "boolean",
      "doc": "Enable querying of feature data from this layer for interactivity.",
      "default": false
    },
    "filter": {
      "type": "filter",
      "doc": "A expression specifying conditions on source features. Only features that match the filter are displayed."
    },
    "layout": {
      "type": "layout",
      "doc": "Layout properties for the layer."
    },
    "paint": {
      "type": "paint",
      "doc": "Default paint properties for this layer."
    },
    "paint.*": {
      "type": "paint",
      "doc": "Class-specific paint properties for this layer. The class name is the part after the first dot."
    }
  },
  "layout": [
    "layout_fill",
    "layout_line",
    "layout_symbol",
    "layout_raster",
    "layout_background"
  ],
  "layout_background": {
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "layout_fill": {
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "layout_line": {
    "line-cap": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "butt",
        "round",
        "square"
      ],
      "default": "butt",
      "doc": "The display of line endings."
    },
    "line-join": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "bevel",
        "round",
        "miter"
      ],
      "default": "miter",
      "doc": "The display of lines when joining."
    },
    "line-miter-limit": {
      "type": "number",
      "default": 2,
      "function": "interpolated",
      "doc": "Used to automatically convert miter joins to bevel joins for sharp angles.",
      "requires": [
        {
          "line-join": "miter"
        }
      ]
    },
    "line-round-limit": {
      "type": "number",
      "default": 1,
      "function": "interpolated",
      "doc": "Used to automatically convert round joins to miter joins for shallow angles.",
      "requires": [
        {
          "line-join": "round"
        }
      ]
    },
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "layout_symbol": {
    "symbol-placement": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
          "point",
          "line"
      ],
      "default": "point",
      "doc": "Label placement relative to its geometry. `line` can only be used on LineStrings and Polygons."
    },
    "symbol-min-distance": {
      "type": "number",
      "default": 250,
      "minimum": 1,
      "function": "interpolated",
      "units": "pixels",
      "doc": "Minimum distance between two symbol anchors.",
      "requires": [
        {
          "symbol-placement": "line"
        }
      ]
    },
    "symbol-avoid-edges": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the symbols will not cross tile edges to avoid mutual collisions. Recommended in layers that don't have enough padding in the vector tile to prevent collisions, or if it is a point symbol layer placed after a line symbol layer."
    },
    "icon-allow-overlap": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the icon will be visible even if it collides with other icons and text.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-ignore-placement": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the icon won't affect placement of other icons and text.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-optional": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the symbol will appear without its icon, in spaces where the icon would make it too large to fit.",
      "requires": [
        "icon-image",
        "text-field"
      ]
    },
    "icon-rotation-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "default": "viewport",
      "doc": "Orientation of icon when map is rotated.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-max-size": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "doc": "The maximum factor to scale the icon.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-image": {
      "type": "string",
      "function": "piecewise-constant",
      "doc": "A string with {tokens} replaced, referencing the data property to pull from.",
      "tokens": true
    },
    "icon-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "function": "interpolated",
      "units": "degrees",
      "doc": "Rotates the icon clockwise.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "function": "interpolated",
      "units": "pixels",
      "doc": "Padding value around icon bounding box to avoid icon collisions.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-keep-upright": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the icon may be flipped to prevent it from being rendered upside-down",
      "requires": [
        "icon-image",
        {
          "icon-rotation-alignment": "map"
        }
      ]
    },
    "icon-offset": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "doc": "Icon's offset distance. Values are [x, y] where negatives indicate left and up, respectively.",
      "requires": [
        "icon-image"
      ]
    },
    "text-rotation-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "default": "viewport",
      "doc": "Orientation of icon or text when map is rotated.",
      "requires": [
        "text-field"
      ]
    },
    "text-field": {
      "type": "string",
      "function": "piecewise-constant",
      "default": "",
      "tokens": true,
      "doc": "Value to use for a text label. Feature properties are specified using tokens like {field_name}."
    },
    "text-font": {
      "type": "string",
      "function": "piecewise-constant",
      "default": "Open Sans Regular, Arial Unicode MS Regular",
      "doc": "Font stack to use for displaying text.",
      "requires": [
        "text-field"
      ]
    },
    "text-max-size": {
      "type": "number",
      "default": 16,
      "minimum": 0,
      "units": "pixels",
      "function": "interpolated",
      "doc": "The maximum size text will be laid out, to calculate collisions with.",
      "requires": [
        "text-field"
      ]
    },
    "text-max-width": {
      "type": "number",
      "default": 15,
      "minimum": 0,
      "units": "em",
      "function": "interpolated",
      "doc": "The maximum line width for text wrapping.",
      "requires": [
        "text-field"
      ]
    },
    "text-line-height": {
      "type": "number",
      "default": 1.2,
      "units": "em",
      "function": "interpolated",
      "doc": "Text leading value for multi-line text.",
      "requires": [
        "text-field"
      ]
    },
    "text-letter-spacing": {
      "type": "number",
      "default": 0,
      "units": "em",
      "function": "interpolated",
      "doc": "Text kerning value.",
      "requires": [
        "text-field"
      ]
    },
    "text-justify": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "left",
        "center",
        "right"
      ],
      "default": "center",
      "doc": "Text justification options.",
      "requires": [
        "text-field"
      ]
    },
    "text-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "center",
        "left",
        "right",
        "top",
        "bottom",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right"
      ],
      "default": "center",
      "doc": "Which part of the text to place closest to the anchor.",
      "requires": [
        "text-field"
      ]
    },
    "text-max-angle": {
      "type": "number",
      "default": 45,
      "units": "degrees",
      "function": "interpolated",
      "doc": "Maximum angle change between adjacent characters.",
      "requires": [
        "text-field",
        {
          "symbol-placement": "line"
        }
      ]
    },
    "text-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "units": "degrees",
      "function": "interpolated",
      "doc": "Rotates the text clockwise.",
      "requires": [
        "text-field"
      ]
    },
    "text-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "units": "pixels",
      "function": "interpolated",
      "doc": "Padding value around text bounding box to avoid label collisions.",
      "requires": [
        "text-field"
      ]
    },
    "text-keep-upright": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": true,
      "doc": "If true, the text may be flipped vertically to prevent it from being rendered upside-down.",
      "requires": [
        "text-field",
        {
          "text-rotation-alignment": "map"
        }
      ]
    },
    "text-transform": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "none",
        "uppercase",
        "lowercase"
      ],
      "default": "none",
      "doc": "Specifies how to capitalize text, similar to the CSS `text-transform` property.",
      "requires": [
        "text-field"
      ]
    },
    "text-offset": {
      "type": "array",
      "doc": "Specifies the distance that text is offset from its anchor horizontally and vertically.",
      "value": "number",
      "units": "ems",
      "function": "interpolated",
      "length": 2,
      "default": [
        0,
        0
      ],
      "requires": [
        "text-field"
      ]
    },
    "text-allow-overlap": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the text will be visible even if it collides with other icons and labels.",
      "requires": [
        "text-field"
      ]
    },
    "text-ignore-placement": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the text won't affect placement of other icons and labels.",
      "requires": [
        "text-field"
      ]
    },
    "text-optional": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the symbol will appear without its text, in spaces where the text would make it too large to fit.",
      "requires": [
        "text-field",
        "icon-image"
      ]
    },
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "layout_raster": {
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "filter": {
    "type": "array",
    "value": "*"
  },
  "filter_operator": {
    "type": "enum",
    "values": [
      "==",
      "!=",
      ">",
      ">=",
      "<",
      "<=",
      "in",
      "!in",
      "all",
      "any",
      "none"
    ]
  },
  "geometry_type": {
    "type": "enum",
    "values": [
      "Point",
      "LineString",
      "Polygon"
    ]
  },
  "function": {
    "stops": {
      "type": "array",
      "required": true,
      "doc": "An array of stops.",
      "value": "function_stop"
    },
    "base": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "doc": "The exponential base of the interpolation curve. It controls the rate at which the result increases. Higher values make the result increase more towards the high end of the range. With `1` the stops are interpolated linearly."
    }
  },
  "function_stop": {
    "type": "array",
    "minimum": 0,
    "maximum": 22,
    "value": [
      "number",
      "color"
    ],
    "length": 2,
    "doc": "Zoom level and value pair."
  },
  "paint": [
    "paint_fill",
    "paint_line",
    "paint_symbol",
    "paint_raster",
    "paint_background"
  ],
  "paint_fill": {
    "fill-antialias": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": true,
      "doc": "Whether or not the fill should be antialiased."
    },
    "fill-opacity": {
      "type": "number",
      "function": "interpolated",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity given to the fill color.",
      "transition": true
    },
    "fill-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color of the fill.",
      "function": "interpolated",
      "transition": true,
      "requires": [
        {
          "!": "fill-image"
        }
      ]
    },
    "fill-outline-color": {
      "type": "color",
      "doc": "The outline color of the fill. Matches the value of `fill-color` if unspecified.",
      "function": "interpolated",
      "transition": true,
      "requires": [
        {
          "!": "fill-image"
        },
        {
          "fill-antialias": true
        }
      ]
    },
    "fill-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively."
    },
    "fill-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "fill-translate"
      ]
    },
    "fill-image": {
      "type": "string",
      "function": "piecewise-constant",
      "transition": true,
      "doc": "Name of image in sprite to use for drawing image fills."
    }
  },
  "paint_line": {
    "line-opacity": {
      "type": "number",
      "doc": "The opacity at which the line will be drawn.",
      "function": "interpolated",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true
    },
    "line-color": {
      "type": "color",
      "doc": "The color with which the line will be drawn.",
      "default": "#000000",
      "function": "interpolated",
      "transition": true,
      "requires": [
        {
          "!": "line-image"
        }
      ]
    },
    "line-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively."
    },
    "line-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "line-translate"
      ]
    },
    "line-width": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Stroke thickness."
    },
    "line-gap-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "doc": "Draws a line casing outside of a line's actual path. Value indicates the width of the inner gap.",
      "function": "interpolated",
      "transition": true,
      "units": "pixels"
    },
    "line-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Blur applied to the line, in pixels."
    },
    "line-dasharray": {
      "type": "array",
      "function": "piecewise-constant",
      "value": "number",
      "doc": "Specifies the lengths of the alternating dashes and gaps that form the dash pattern. The lengths are later scaled by the line width. To convert a dash length to pixels, multiply the length by the current line width.",
      "minimum": 0,
      "transition": true,
      "units": "line widths",
      "requires": [
        {
          "!": "line-image"
        }
      ]
    },
    "line-image": {
      "type": "string",
      "function": "piecewise-constant",
      "transition": true,
      "doc": "Name of image in sprite to use for drawing image lines."
    }
  },
  "paint_symbol": {
    "icon-opacity": {
      "doc": "The opacity at which the icon will be drawn.",
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "transition": true,
      "requires": [
        "icon-image"
      ]
    },
    "icon-size": {
      "type": "number",
      "default": 1,
      "function": "interpolated",
      "transition": true,
      "doc": "Scale factor for icon. 1 is original size, 3 triples the size.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-color": {
      "type": "color",
      "default": "#000000",
      "function": "interpolated",
      "transition": true,
      "doc": "The color of the icon. This can only be used with sdf icons.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": "interpolated",
      "transition": true,
      "doc": "The color of the icon's halo. Icon halos can only be used with sdf icons.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the icon outline.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Fade out the halo towards the outside.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "An icon's offset distance. Values are [x, y] where negatives indicate left and up, respectively.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "icon-image",
        "icon-translate"
      ]
    },
    "text-opacity": {
      "type": "number",
      "doc": "The opacity at which the text will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "transition": true,
      "requires": [
        "text-field"
      ]
    },
    "text-size": {
      "type": "number",
      "default": 16,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Font size. If unspecified, the text will be as big as allowed by the layer definition.",
      "requires": [
        "text-field"
      ]
    },
    "text-color": {
      "type": "color",
      "doc": "The color with which the text will be drawn.",
      "default": "#000000",
      "function": "interpolated",
      "transition": true,
      "requires": [
        "text-field"
      ]
    },
    "text-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": "interpolated",
      "transition": true,
      "doc": "The color of the text's halo, which helps it stand out from backgrounds.",
      "requires": [
        "text-field"
      ]
    },
    "text-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the font outline. Max text halo width is 1/4 of the font-size.",
      "requires": [
        "text-field"
      ]
    },
    "text-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "The halo's fadeout distance towards the outside.",
      "requires": [
        "text-field"
      ]
    },
    "text-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Label offset. Values are [x, y] where negatives indicate left and up, respectively.",
      "requires": [
        "text-field"
      ]
    },
    "text-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "text-field",
        "text-translate"
      ]
    }
  },
  "paint_raster": {
    "raster-opacity": {
      "type": "number",
      "doc": "The opacity at which the image will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "transition": true
    },
    "raster-hue-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "function": "interpolated",
      "transition": true,
      "units": "degrees",
      "doc": "Rotates hues around the color wheel."
    },
    "raster-brightness-min": {
      "type": "number",
      "function": "interpolated",
      "doc": "Increase or reduce the brightness of the image. The value is the minimum brightness.",
      "default": 0,
      "minimum": 0,
      "maximum": 1,
      "transition": true
    },
    "raster-brightness-max": {
      "type": "number",
      "function": "interpolated",
      "doc": "Increase or reduce the brightness of the image. The value is the maximum brightness.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true
    },
    "raster-saturation": {
      "type": "number",
      "doc": "Increase or reduce the saturation of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": "interpolated",
      "transition": true
    },
    "raster-contrast": {
      "type": "number",
      "doc": "Increase or reduce the contrast of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": "interpolated",
      "transition": true
    },
    "raster-fade-duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "milliseconds",
      "doc": "Fade duration when a new tile is added."
    }
  },
  "paint_background": {
    "background-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color with which the background will be drawn.",
      "function": "interpolated",
      "transition": true,
      "requires": [
        {
          "!": "background-image"
        }
      ]
    },
    "background-image": {
      "type": "string",
      "function": "piecewise-constant",
      "transition": true,
      "doc": "Optionally an image which is drawn as the background."
    },
    "background-opacity": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity at which the background will be drawn.",
      "function": "interpolated",
      "transition": true
    }
  },
  "transition": {
    "duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Time allotted for transitions to complete."
    },
    "delay": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Length of time before a transition begins."
    }
  }
}

},{}],40:[function(_dereq_,module,exports){
module.exports={
  "$version": 8,
  "$root": {
    "version": {
      "required": true,
      "type": "enum",
      "values": [8],
      "doc": "Style specification version number. Must be 8.",
      "example": 8
    },
    "name": {
      "type": "string",
      "doc": "A human-readable name for the style.",
      "example": "Bright"
    },
    "metadata": {
      "type": "*",
      "doc": "Arbitrary properties useful to track with the stylesheet, but do not influence rendering. Properties should be prefixed to avoid collisions, like 'mapbox:'."
    },
    "center": {
      "type": "array",
      "value": "number",
      "doc": "Default map center in longitude and latitude.  The style center will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
      "example": [-73.9749, 40.7736]
    },
    "zoom": {
      "type": "number",
      "doc": "Default zoom level.  The style zoom will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
      "example": 12.5
    },
    "bearing": {
      "type": "number",
      "default": 0,
      "period": 360,
      "units": "degrees",
      "doc": "Default bearing, in degrees clockwise from true north.  The style bearing will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
      "example": 29
    },
    "pitch": {
      "type": "number",
      "default": 0,
      "units": "degrees",
      "doc": "Default pitch, in degrees. Zero is perpendicular to the surface, for a look straight down at the map, while a greater value like 60 looks ahead towards the horizon. The style pitch will be used only if the map has not been positioned by other means (e.g. map options or user interaction).",
      "example": 50
    },
    "light": {
      "type": "light",
      "doc": "The global light source.",
      "example": {
        "anchor": "viewport",
        "color": "white",
        "intensity": 0.4
      }
    },
    "sources": {
      "required": true,
      "type": "sources",
      "doc": "Data source specifications.",
      "example": {
        "mapbox-streets": {
          "type": "vector",
          "url": "mapbox://mapbox.mapbox-streets-v6"
        }
      }
    },
    "sprite": {
      "type": "string",
      "doc": "A base URL for retrieving the sprite image and metadata. The extensions `.png`, `.json` and scale factor `@2x.png` will be automatically appended. This property is required if any layer uses the `background-pattern`, `fill-pattern`, `line-pattern`, `fill-extrusion-pattern`, or `icon-image` properties.",
      "example": "mapbox://sprites/mapbox/bright-v8"
    },
    "glyphs": {
      "type": "string",
      "doc": "A URL template for loading signed-distance-field glyph sets in PBF format. The URL must include `{fontstack}` and `{range}` tokens. This property is required if any layer uses the `text-field` layout property.",
      "example": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf"
    },
    "transition": {
      "type": "transition",
      "doc": "A global transition definition to use as a default across properties.",
      "example": {
        "duration": 300,
        "delay": 0
      }
    },
    "layers": {
      "required": true,
      "type": "array",
      "value": "layer",
      "doc": "Layers will be drawn in the order of this array.",
      "example": [
        {
          "id": "water",
          "source": "mapbox-streets",
          "source-layer": "water",
          "type": "fill",
          "paint": {
            "fill-color": "#00ffff"
          }
        }
      ]
    }
  },
  "sources": {
    "*": {
      "type": "source",
      "doc": "Specification of a data source. For vector and raster sources, either TileJSON or a URL to a TileJSON must be provided. For image and video sources, a URL must be provided. For GeoJSON sources, a URL or inline GeoJSON must be provided."
    }
  },
  "source": [
    "source_tile",
    "source_geojson",
    "source_video",
    "source_image",
    "source_canvas"
  ],
  "source_tile": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "vector": {
            "doc": "A vector tile source."
        },
        "raster": {
            "doc": "A raster tile source."
        }
      },
      "doc": "The data type of the tile source."
    },
    "url": {
      "type": "string",
      "doc": "A URL to a TileJSON resource. Supported protocols are `http:`, `https:`, and `mapbox://<mapid>`."
    },
    "tiles": {
      "type": "array",
      "value": "string",
      "doc": "An array of one or more tile source URLs, as in the TileJSON spec."
    },
    "bounds": {
      "type": "array",
      "value": "number",
      "length": 4,
      "default": [-180, -85.0511, 180, 85.0511],
      "doc": "An array containing the longitude and latitude of the southwest and northeast corners of the source's bounding box in the following order: `[sw.lng, sw.lat, ne.lng, ne.lat]`. When this property is included in a source, no tiles outside of the given bounds are requested by Mapbox GL."
    },
    "minzoom": {
      "type": "number",
      "default": 0,
      "doc": "Minimum zoom level for which tiles are available, as in the TileJSON spec."
    },
    "maxzoom": {
      "type": "number",
      "default": 22,
      "doc": "Maximum zoom level for which tiles are available, as in the TileJSON spec. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels."
    },
    "tileSize": {
      "type": "number",
      "default": 512,
      "units": "pixels",
      "doc": "The minimum visual size to display tiles for this layer. Only configurable for raster layers."
    },
    "scheme": {
      "type": "enum",
      "values": {
        "xyz": {
          "doc": "Slippy map tilenames scheme."
        },
        "tms": {
          "doc": "OSGeo spec scheme."
        }
      },
      "default": "xyz",
      "doc": "Influences the y direction of the tile coordinates. The global-mercator (aka Spherical Mercator) profile is assumed."
    },
    "attribution": {
      "type": "string",
      "doc": "Contains an attribution to be displayed when the map is shown to a user."
    },
    "*": {
      "type": "*",
      "doc": "Other keys to configure the data source."
    }
  },
  "source_geojson": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "geojson": {
            "doc": "A GeoJSON data source."
        }
      },
      "doc": "The data type of the GeoJSON source."
    },
    "data": {
      "type": "*",
      "doc": "A URL to a GeoJSON file, or inline GeoJSON."
    },
    "maxzoom": {
      "type": "number",
      "default": 18,
      "doc": "Maximum zoom level at which to create vector tiles (higher means greater detail at high zoom levels)."
    },
    "buffer": {
      "type": "number",
      "default": 128,
      "maximum": 512,
      "minimum": 0,
      "doc": "Size of the tile buffer on each side. A value of 0 produces no buffer. A value of 512 produces a buffer as wide as the tile itself. Larger values produce fewer rendering artifacts near tile edges and slower performance."
    },
    "tolerance": {
      "type": "number",
      "default": 0.375,
      "doc": "Douglas-Peucker simplification tolerance (higher means simpler geometries and faster performance)."
    },
    "cluster": {
      "type": "boolean",
      "default": false,
      "doc": "If the data is a collection of point features, setting this to true clusters the points by radius into groups."
    },
    "clusterRadius": {
      "type": "number",
      "default": 50,
      "minimum": 0,
      "doc": "Radius of each cluster if clustering is enabled. A value of 512 indicates a radius equal to the width of a tile."
    },
    "clusterMaxZoom": {
      "type": "number",
      "doc": "Max zoom on which to cluster points if clustering is enabled. Defaults to one zoom less than maxzoom (so that last zoom features are not clustered)."
    }
  },
  "source_video": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "video": {
            "doc": "A video data source."
        }
      },
      "doc": "The data type of the video source."
    },
    "urls": {
      "required": true,
      "type": "array",
      "value": "string",
      "doc": "URLs to video content in order of preferred format."
    },
    "coordinates": {
      "required": true,
      "doc": "Corners of video specified in longitude, latitude pairs.",
      "type": "array",
      "length": 4,
      "value": {
        "type": "array",
        "length": 2,
        "value": "number",
        "doc": "A single longitude, latitude pair."
      }
    }
  },
  "source_image": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "image": {
            "doc": "An image data source."
        }
      },
      "doc": "The data type of the image source."
    },
    "url": {
      "required": true,
      "type": "string",
      "doc": "URL that points to an image."
    },
    "coordinates": {
      "required": true,
      "doc": "Corners of image specified in longitude, latitude pairs.",
      "type": "array",
      "length": 4,
      "value": {
        "type": "array",
        "length": 2,
        "value": "number",
        "doc": "A single longitude, latitude pair."
      }
    }
  },
  "source_canvas": {
    "type": {
      "required": true,
      "type": "enum",
      "values": {
        "canvas": {
          "doc": "A canvas data source."
        }
      },
      "doc": "The data type of the canvas source."
    },
    "coordinates": {
      "required": true,
      "doc": "Corners of canvas specified in longitude, latitude pairs.",
      "type": "array",
      "length": 4,
      "value": {
        "type": "array",
        "length": 2,
        "value": "number",
        "doc": "A single longitude, latitude pair."
      }
    },
    "animate": {
      "type": "boolean",
      "default": "true",
      "doc": "Whether the canvas source is animated. If the canvas is static, `animate` should be set to `false` to improve performance."
    },
    "canvas": {
      "type": "string",
      "required": true,
      "doc": "HTML ID of the canvas from which to read pixels."
    }
  },
  "layer": {
    "id": {
      "type": "string",
      "doc": "Unique layer name.",
      "required": true
    },
    "type": {
      "type": "enum",
      "values": {
        "fill": {
          "doc": "A filled polygon with an optional stroked border.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "line": {
          "doc": "A stroked line.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "symbol": {
          "doc": "An icon or a text label.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "circle": {
          "doc": "A filled circle.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "heatmap": {
          "doc": "A heatmap.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.41.0"
            }
          }
        },
        "fill-extrusion": {
          "doc": "An extruded (3D) polygon.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.27.0",
              "android": "5.1.0",
              "ios": "3.6.0",
              "macos": "0.5.0"
            }
          }
        },
        "raster": {
          "doc": "Raster map textures such as satellite imagery.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        },
        "background": {
          "doc": "The background color or pattern of the map.",
          "sdk-support": {
            "basic functionality": {
              "js": "0.10.0",
              "android": "2.0.1",
              "ios": "2.0.0",
              "macos": "0.1.0"
            }
          }
        }
      },
      "doc": "Rendering type of this layer."
    },
    "metadata": {
      "type": "*",
      "doc": "Arbitrary properties useful to track with the layer, but do not influence rendering. Properties should be prefixed to avoid collisions, like 'mapbox:'."
    },
    "source": {
      "type": "string",
      "doc": "Name of a source description to be used for this layer. Required for all layer types except `background`."
    },
    "source-layer": {
      "type": "string",
      "doc": "Layer to use from a vector tile source. Required for vector tile sources; prohibited for all other source types, including GeoJSON sources."
    },
    "minzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 24,
      "doc": "The minimum zoom level on which the layer gets parsed and appears on."
    },
    "maxzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 24,
      "doc": "The maximum zoom level on which the layer gets parsed and appears on."
    },
    "filter": {
      "type": "filter",
      "doc": "A expression specifying conditions on source features. Only features that match the filter are displayed."
    },
    "layout": {
      "type": "layout",
      "doc": "Layout properties for the layer."
    },
    "paint": {
      "type": "paint",
      "doc": "Default paint properties for this layer."
    }
  },
  "layout": [
    "layout_fill",
    "layout_line",
    "layout_circle",
    "layout_heatmap",
    "layout_fill-extrusion",
    "layout_symbol",
    "layout_raster",
    "layout_background"
  ],
  "layout_background": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    }
  },
  "layout_fill": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    }
  },
  "layout_circle": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    }
  },
  "layout_heatmap": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        }
      }
    }
  },
  "layout_fill-extrusion": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    }
  },
  "layout_line": {
    "line-cap": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "butt": {
            "doc": "A cap with a squared-off end which is drawn to the exact endpoint of the line."
        },
        "round": {
            "doc": "A cap with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line."
        },
        "square": {
            "doc": "A cap with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width."
        }
      },
      "default": "butt",
      "doc": "The display of line endings.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-join": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "bevel": {
            "doc": "A join with a squared-off end which is drawn beyond the endpoint of the line at a distance of one-half of the line's width."
        },
        "round": {
            "doc": "A join with a rounded end which is drawn beyond the endpoint of the line at a radius of one-half of the line's width and centered on the endpoint of the line."
        },
        "miter": {
            "doc": "A join with a sharp, angled corner which is drawn with the outer sides beyond the endpoint of the path until they meet."
        }
      },
      "default": "miter",
      "doc": "The display of lines when joining.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.40.0"
        }
      }
    },
    "line-miter-limit": {
      "type": "number",
      "default": 2,
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Used to automatically convert miter joins to bevel joins for sharp angles.",
      "requires": [
        {
          "line-join": "miter"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-round-limit": {
      "type": "number",
      "default": 1.05,
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Used to automatically convert round joins to miter joins for shallow angles.",
      "requires": [
        {
          "line-join": "round"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "layout_symbol": {
    "symbol-placement": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
          "point": {
              "doc": "The label is placed at the point where the geometry is located."
          },
          "line": {
              "doc": "The label is placed along the line of the geometry. Can only be used on `LineString` and `Polygon` geometries."
          }
      },
      "default": "point",
      "doc": "Label placement relative to its geometry.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "symbol-spacing": {
      "type": "number",
      "default": 250,
      "minimum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "units": "pixels",
      "doc": "Distance between two symbol anchors.",
      "requires": [
        {
          "symbol-placement": "line"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "symbol-avoid-edges": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, the symbols will not cross tile edges to avoid mutual collisions. Recommended in layers that don't have enough padding in the vector tile to prevent collisions, or if it is a point symbol layer placed after a line symbol layer.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-allow-overlap": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, the icon will be visible even if it collides with other previously drawn symbols.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-ignore-placement": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, other symbols can be visible even if they collide with the icon.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-optional": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, text will display without their corresponding icons when the icon collides with other symbols and the text does not.",
      "requires": [
        "icon-image",
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-rotation-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "When `symbol-placement` is set to `point`, aligns icons east-west. When `symbol-placement` is set to `line`, aligns icon x-axes with the line."
        },
        "viewport": {
            "doc": "Produces icons whose x-axes are aligned with the x-axis of the viewport, regardless of the value of `symbol-placement`."
        },
        "auto": {
            "doc": "When `symbol-placement` is set to `point`, this is equivalent to `viewport`. When `symbol-placement` is set to `line`, this is equivalent to `map`."
        }
      },
      "default": "auto",
      "doc": "In combination with `symbol-placement`, determines the rotation behavior of icons.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "`auto` value": {
          "js": "0.25.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.3.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-size": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "units": "factor of the original icon size",
      "doc": "Scales the original size of the icon by the provided factor. The new pixel size of the image will be the original pixel size multiplied by `icon-size`. 1 is the original size; 3 triples the size of the image.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "icon-text-fit": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "none": {
            "doc": "The icon is displayed at its intrinsic aspect ratio."
        },
        "width": {
            "doc": "The icon is scaled in the x-dimension to fit the width of the text."
        },
        "height": {
            "doc": "The icon is scaled in the y-dimension to fit the height of the text."
        },
        "both": {
            "doc": "The icon is scaled in both x- and y-dimensions."
        }
      },
      "default": "none",
      "doc": "Scales the icon to fit around the associated text.",
      "requires": [
        "icon-image",
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.21.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.2.1"
        },
        "data-driven styling": {}
      }
    },
    "icon-text-fit-padding": {
      "type": "array",
      "value": "number",
      "length": 4,
      "default": [
        0,
        0,
        0,
        0
      ],
      "units": "pixels",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Size of the additional area added to dimensions determined by `icon-text-fit`, in clockwise order: top, right, bottom, left.",
      "requires": [
        "icon-image",
        "text-field",
        {
          "icon-text-fit": [
            "both",
            "width",
            "height"
          ]
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.21.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.2.1"
        },
        "data-driven styling": {}
      }
    },
    "icon-image": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "doc": "Name of image in sprite to use for drawing an image background. A string with `{tokens}` replaced, referencing the data property to pull from. (`{token}` replacement is only supported for literal `icon-image` values; not for property functions.)",
      "tokens": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "icon-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "units": "degrees",
      "doc": "Rotates the icon clockwise.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.21.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "units": "pixels",
      "doc": "Size of the additional area around the icon bounding box used for detecting symbol collisions.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-keep-upright": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, the icon may be flipped to prevent it from being rendered upside-down.",
      "requires": [
        "icon-image",
        {
          "icon-rotation-alignment": "map"
        },
        {
          "symbol-placement": "line"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-offset": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "Offset distance of icon from its anchor. Positive values indicate right and down, while negative values indicate left and up. When combined with `icon-rotate` the offset will be as if the rotated direction was up.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "center": {
            "doc": "The center of the icon is placed closest to the anchor."
        },
        "left": {
            "doc": "The left side of the icon is placed closest to the anchor."
        },
        "right": {
            "doc": "The right side of the icon is placed closest to the anchor."
        },
        "top": {
            "doc": "The top of the icon is placed closest to the anchor."
        },
        "bottom": {
            "doc": "The bottom of the icon is placed closest to the anchor."
        },
        "top-left": {
            "doc": "The top left corner of the icon is placed closest to the anchor."
        },
        "top-right": {
            "doc": "The top right corner of the icon is placed closest to the anchor."
        },
        "bottom-left": {
            "doc": "The bottom left corner of the icon is placed closest to the anchor."
        },
        "bottom-right": {
            "doc": "The bottom right corner of the icon is placed closest to the anchor."
        }
      },
      "default": "center",
      "doc": "Part of the icon placed closest to the anchor.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.40.0"
        },
        "data-driven styling": {
          "js": "0.40.0"
        }
      }
    },
    "icon-pitch-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The icon is aligned to the plane of the map."
        },
        "viewport": {
            "doc": "The icon is aligned to the plane of the viewport."
        },
        "auto": {
            "doc": "Automatically matches the value of `icon-rotation-alignment`."
        }
      },
      "default": "auto",
      "doc": "Orientation of icon when map is pitched.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.39.0"
        },
        "data-driven styling": {}
      }
    },
    "text-pitch-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The text is aligned to the plane of the map."
        },
        "viewport": {
            "doc": "The text is aligned to the plane of the viewport."
        },
        "auto": {
            "doc": "Automatically matches the value of `text-rotation-alignment`."
        }
      },
      "default": "auto",
      "doc": "Orientation of text when map is pitched.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.21.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.2.1"
        },
        "`auto` value": {
          "js": "0.25.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.3.0"
        },
        "data-driven styling": {}
      }
    },
    "text-rotation-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "When `symbol-placement` is set to `point`, aligns text east-west. When `symbol-placement` is set to `line`, aligns text x-axes with the line."
        },
        "viewport": {
            "doc": "Produces glyphs whose x-axes are aligned with the x-axis of the viewport, regardless of the value of `symbol-placement`."
        },
        "auto": {
            "doc": "When `symbol-placement` is set to `point`, this is equivalent to `viewport`. When `symbol-placement` is set to `line`, this is equivalent to `map`."
        }
      },
      "default": "auto",
      "doc": "In combination with `symbol-placement`, determines the rotation behavior of the individual glyphs forming the text.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "`auto` value": {
          "js": "0.25.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.3.0"
        },
        "data-driven styling": {}
      }
    },
    "text-field": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "default": "",
      "tokens": true,
      "doc": "Value to use for a text label. Feature properties are specified using tokens like `{field_name}`. (`{token}` replacement is only supported for literal `text-field` values; not for property functions.)",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-font": {
      "type": "array",
      "value": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": ["Open Sans Regular", "Arial Unicode MS Regular"],
      "doc": "Font stack to use for displaying text.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-size": {
      "type": "number",
      "default": 16,
      "minimum": 0,
      "units": "pixels",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "Font size.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "text-max-width": {
      "type": "number",
      "default": 10,
      "minimum": 0,
      "units": "ems",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "The maximum line width for text wrapping.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
            "js": "0.40.0"
        }
      }
    },
    "text-line-height": {
      "type": "number",
      "default": 1.2,
      "units": "ems",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Text leading value for multi-line text.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-letter-spacing": {
      "type": "number",
      "default": 0,
      "units": "ems",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "Text tracking amount.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
            "js": "0.40.0"
        }
      }
    },
    "text-justify": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "left": {
            "doc": "The text is aligned to the left."
        },
        "center": {
            "doc": "The text is centered."
        },
        "right": {
            "doc": "The text is aligned to the right."
        }
      },
      "default": "center",
      "doc": "Text justification options.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
            "js": "0.39.0"
        }
      }
    },
    "text-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "center": {
            "doc": "The center of the text is placed closest to the anchor."
        },
        "left": {
            "doc": "The left side of the text is placed closest to the anchor."
        },
        "right": {
            "doc": "The right side of the text is placed closest to the anchor."
        },
        "top": {
            "doc": "The top of the text is placed closest to the anchor."
        },
        "bottom": {
            "doc": "The bottom of the text is placed closest to the anchor."
        },
        "top-left": {
            "doc": "The top left corner of the text is placed closest to the anchor."
        },
        "top-right": {
            "doc": "The top right corner of the text is placed closest to the anchor."
        },
        "bottom-left": {
            "doc": "The bottom left corner of the text is placed closest to the anchor."
        },
        "bottom-right": {
            "doc": "The bottom right corner of the text is placed closest to the anchor."
        }
      },
      "default": "center",
      "doc": "Part of the text placed closest to the anchor.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
            "js": "0.39.0"
        }
      }
    },
    "text-max-angle": {
      "type": "number",
      "default": 45,
      "units": "degrees",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Maximum angle change between adjacent characters.",
      "requires": [
        "text-field",
        {
          "symbol-placement": "line"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "units": "degrees",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "doc": "Rotates the text clockwise.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "text-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "units": "pixels",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Size of the additional area around the text bounding box used for detecting symbol collisions.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-keep-upright": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": true,
      "doc": "If true, the text may be flipped vertically to prevent it from being rendered upside-down.",
      "requires": [
        "text-field",
        {
          "text-rotation-alignment": "map"
        },
        {
          "symbol-placement": "line"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-transform": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "property-function": true,
      "values": {
        "none": {
            "doc": "The text is not altered."
        },
        "uppercase": {
            "doc": "Forces all letters to be displayed in uppercase."
        },
        "lowercase": {
            "doc": "Forces all letters to be displayed in lowercase."
        }
      },
      "default": "none",
      "doc": "Specifies how to capitalize text, similar to the CSS `text-transform` property.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-offset": {
      "type": "array",
      "doc": "Offset distance of text from its anchor. Positive values indicate right and down, while negative values indicate left and up.",
      "value": "number",
      "units": "ems",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "length": 2,
      "default": [
        0,
        0
      ],
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.35.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "text-allow-overlap": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, the text will be visible even if it collides with other previously drawn symbols.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-ignore-placement": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, other symbols can be visible even if they collide with the text.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-optional": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": false,
      "doc": "If true, icons will display without their corresponding text when the text collides with other symbols and the icon does not.",
      "requires": [
        "text-field",
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "layout_raster": {
    "visibility": {
      "type": "enum",
      "values": {
        "visible": {
            "doc": "The layer is shown."
        },
        "none": {
            "doc": "The layer is not shown."
        }
      },
      "default": "visible",
      "doc": "Whether this layer is displayed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "filter": {
    "type": "array",
    "value": "*",
    "doc": "A filter selects specific features from a layer."
  },
  "filter_operator": {
    "type": "enum",
    "values": {
      "==": {
          "doc": "`[\"==\", key, value]` equality: `feature[key] = value`"
      },
      "!=": {
          "doc": "`[\"!=\", key, value]` inequality: `feature[key] ≠ value`"
      },
      ">": {
          "doc": "`[\">\", key, value]` greater than: `feature[key] > value`"
      },
      ">=": {
          "doc": "`[\">=\", key, value]` greater than or equal: `feature[key] ≥ value`"
      },
      "<": {
          "doc": "`[\"<\", key, value]` less than: `feature[key] < value`"
      },
      "<=": {
          "doc": "`[\"<=\", key, value]` less than or equal: `feature[key] ≤ value`"
      },
      "in": {
          "doc": "`[\"in\", key, v0, ..., vn]` set inclusion: `feature[key] ∈ {v0, ..., vn}`"
      },
      "!in": {
          "doc": "`[\"!in\", key, v0, ..., vn]` set exclusion: `feature[key] ∉ {v0, ..., vn}`"
      },
      "all": {
          "doc": "`[\"all\", f0, ..., fn]` logical `AND`: `f0 ∧ ... ∧ fn`"
      },
      "any": {
          "doc": "`[\"any\", f0, ..., fn]` logical `OR`: `f0 ∨ ... ∨ fn`"
      },
      "none": {
          "doc": "`[\"none\", f0, ..., fn]` logical `NOR`: `¬f0 ∧ ... ∧ ¬fn`"
      },
      "has": {
          "doc": "`[\"has\", key]` `feature[key]` exists"
      },
      "!has": {
          "doc": "`[\"!has\", key]` `feature[key]` does not exist"
      }
    },
    "doc": "The filter operator."
  },
  "geometry_type": {
    "type": "enum",
    "values": {
      "Point": {
          "doc": "Filter to point geometries."
      },
      "LineString": {
          "doc": "Filter to line geometries."
      },
      "Polygon": {
          "doc": "Filter to polygon geometries."
      }
    },
    "doc": "The geometry type for the filter to select."
  },
  "function": {
    "expression": {
      "type": "expression",
      "doc": "An expression."
    },
    "stops": {
      "type": "array",
      "doc": "An array of stops.",
      "value": "function_stop"
    },
    "base": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "doc": "The exponential base of the interpolation curve. It controls the rate at which the result increases. Higher values make the result increase more towards the high end of the range. With `1` the stops are interpolated linearly."
    },
    "property": {
      "type": "string",
      "doc": "The name of a feature property to use as the function input.",
      "default": "$zoom"
    },
    "type": {
      "type": "enum",
      "values": {
          "identity": {
              "doc": "Return the input value as the output value."
          },
          "exponential": {
              "doc": "Generate an output by interpolating between stops just less than and just greater than the function input."
          },
          "interval": {
              "doc": "Return the output value of the stop just less than the function input."
          },
          "categorical": {
              "doc": "Return the output value of the stop equal to the function input."
          }
      },
      "doc": "The interpolation strategy to use in function evaluation.",
      "default": "exponential"
    },
    "colorSpace": {
      "type": "enum",
      "values": {
          "rgb": {
              "doc": "Use the RGB color space to interpolate color values"
          },
          "lab": {
              "doc": "Use the LAB color space to interpolate color values."
          },
          "hcl": {
              "doc": "Use the HCL color space to interpolate color values, interpolating the Hue, Chroma, and Luminance channels individually."
          }
      },
      "doc": "The color space in which colors interpolated. Interpolating colors in perceptual color spaces like LAB and HCL tend to produce color ramps that look more consistent and produce colors that can be differentiated more easily than those interpolated in RGB space.",
      "default": "rgb"
    },
    "default": {
      "type": "*",
      "required": false,
      "doc": "A value to serve as a fallback function result when a value isn't otherwise available. It is used in the following circumstances:\n* In categorical functions, when the feature value does not match any of the stop domain values.\n* In property and zoom-and-property functions, when a feature does not contain a value for the specified property.\n* In identity functions, when the feature value is not valid for the style property (for example, if the function is being used for a `circle-color` property but the feature property value is not a string or not a valid color).\n* In interval or exponential property and zoom-and-property functions, when the feature value is not numeric.\nIf no default is provided, the style property's default is used in these circumstances."
    }
  },
  "function_stop": {
    "type": "array",
    "minimum": 0,
    "maximum": 22,
    "value": [
      "number",
      "color"
    ],
    "length": 2,
    "doc": "Zoom level and value pair."
  },
  "expression": {
    "type": "array",
    "value": "*",
    "minimum": 1,
    "doc": "An expression defines a function that can be used for data-driven style properties or feature filters."
  },
  "expression_name": {
    "doc": "",
    "type": "enum",
    "values": {
      "let": {
        "doc": "Binds expressions to named variables, which can then be referenced in the result expression using [\"var\", \"variable_name\"].",
        "group": "Variable binding"
      },
      "var": {
        "doc": "References variable bound using \"let\".",
        "group": "Variable binding"
      },
      "literal": {
        "doc": "Provides a literal array or object value.",
        "group": "Types"
      },
      "array": {
        "doc": "Asserts that the input is an array (optionally with a specific item type and length).  If, when the input expression is evaluated, it is not of the asserted type, then this assertion will cause the whole expression to be aborted.",
        "group": "Types"
      },
      "at": {
        "doc": "Retrieves an item from an array.",
        "group": "Lookup"
      },
        "case": {
        "doc": "Selects the first output whose corresponding test condition evaluates to true.",
        "group": "Decision"
      },
      "match": {
        "doc": "Selects the output whose label value matches the input value, or the fallback value if no match is found. The `input` can be any string or number expression (e.g. `[\"get\", \"building_type\"]`). Each label can either be a single literal value or an array of values.",
        "group": "Decision"
      },
      "coalesce": {
        "doc": "Evaluates each expression in turn until the first non-null value is obtained, and returns that value.",
        "group": "Decision"
      },
      "step": {
        "doc": "Produces discrete, stepped results by evaluating a piecewise-constant function defined by pairs of input and output values (\"stops\"). The `input` may be any numeric expression (e.g., `[\"get\", \"population\"]`). Stop inputs must be numeric literals in strictly ascending order. Returns the output value of the stop just less than the input, or the first input if the input is less than the first stop.",
        "group": "Ramps, scales, curves"
      },
      "interpolate": {
        "doc": "Produces continuous, smooth results by interpolating between pairs of input and output values (\"stops\"). The `input` may be any numeric expression (e.g., `[\"get\", \"population\"]`). Stop inputs must be numeric literals in strictly ascending order. The output type must be `number`, `array<number>`, or `color`.\n\nInterpolation types:\n- `[\"linear\"]`: interpolates linearly between the pair of stops just less than and just greater than the input.\n- `[\"exponential\", base]`: interpolates exponentially between the stops just less than and just greater than the input. `base` controls the rate at which the output increases: higher values make the output increase more towards the high end of the range. With values close to 1 the output increases linearly.\n- `[\"cubic-bezier\", x1, y2, x2, y2]`: interpolates using the cubic bezier curve defined by the given control points.",
        "group": "Ramps, scales, curves"
      },
      "ln2": {
        "doc": "Returns mathematical constant ln(2).",
        "group": "Math"
      },
      "pi": {
        "doc": "Returns the mathematical constant pi.",
        "group": "Math"
      },
      "e": {
        "doc": "Returns the mathematical constant e.",
        "group": "Math"
      },
      "typeof": {
        "doc": "Returns a string describing the type of the given value.",
        "group": "Types"
      },
      "string": {
        "doc": "Asserts that the input value is a string. If multiple values are provided, each one is evaluated in order until a string value is obtained. If, when the last provided input is evaluated, it is not of the asserted type, then this assertion will cause the whole expression to be aborted.",
        "group": "Types"
      },
      "number": {
        "doc": "Asserts that the input value is a number. If multiple values are provided, each one is evaluated in order until a number value is obtained. If, when the last provided input is evaluated, it is not a number, then this assertion will cause the whole expression to be aborted.",
        "group": "Types"
      },
      "boolean": {
        "doc": "Asserts that the input value is a boolean. If multiple values are provided, each one is evaluated in order until a boolean value is obtained. If, when the last provided input is evaluated, it is not of the asserted type, then this assertion will cause the whole expression to be aborted.",
        "group": "Types"
      },
      "object": {
        "doc": "Asserts that the input value is an Objects.",
        "group": "Types"
      },
      "to-string": {
        "doc": "Coerces the input value to a string.",
        "group": "Types"
      },
      "to-number": {
        "doc": "Coerces the input value to a number, if possible. If multiple values are provided, each one is evaluated in order until the first successful conversion is obtained.",
        "group": "Types"
      },
      "to-boolean": {
        "doc": "Coerces the input value to a boolean.",
        "group": "Types"
      },
      "to-rgba": {
        "doc": "Returns the an array of the given color's r, g, b, a components.",
        "group": "Color"
      },
      "to-color": {
        "doc": "Coerces the input value to a color. If multiple values are provided, each one is evaluated in order until the first successful conversion is obtained.",
        "group": "Types"
      },
      "rgb": {
        "doc": "Creates a color value from r, g, b components.",
        "group": "Color"
      },
      "rgba": {
        "doc": "Creates a color value from r, g, b, a components.",
        "group": "Color"
      },
      "get": {
        "doc": "Retrieves a property value from the current feature's properties (or from another object if one is provided).  Returns null if the requested property is missing.",
        "group": "Lookup"
      },
      "has": {
        "doc": "Tests for the presence of an property value in the current featur's properties (or from another object if one is provided).",
        "group": "Lookup"
      },
      "length": {
        "doc": "Gets the length of an array or string.",
        "group": "Lookup"
      },
      "properties": {
        "doc": "Gets the feature properties object.  Note that in some cases, it may be more efficient to use [\"get\", \"property_name\"] directly.",
        "group": "Feature data"
      },
      "geometry-type": {
        "doc": "Gets the feature's geometry type: Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon.",
        "group": "Feature data"
      },
      "id": {
        "doc": "Gets the feature's id, if it has one.",
        "group": "Feature data"
      },
      "zoom": {
        "doc": "Gets the current zoom level.  Note that in style layout and paint properties, [\"zoom\"] may only appear as the input to a top-level \"step\" or \"interpolate\" expression.",
        "group": "Zoom"
      },
      "heatmap-density": {
        "doc": "Gets the kernel density estimation of a pixel in a heatmap layer, which is a relative measure of how many data points are crowded around a particular pixel. Can only be used in the `heatmap-color` property.",
        "group": "Heatmap"
      },
      "+": {
        "doc": "",
        "group": "Math"
      },
      "*": {
        "doc": "",
        "group": "Math"
      },
      "-": {
        "doc": "",
        "group": "Math"
      },
      "/": {
        "doc": "",
        "group": "Math"
      },
      "%": {
        "doc": "",
        "group": "Math"
      },
      "^": {
        "doc": "",
        "group": "Math"
      },
      "sqrt": {
        "doc": "",
        "group": "Math"
      },
      "log10": {
        "doc": "",
        "group": "Math"
      },
      "ln": {
        "doc": "",
        "group": "Math"
      },
      "log2": {
        "doc": "",
        "group": "Math"
      },
      "sin": {
        "doc": "",
        "group": "Math"
      },
      "cos": {
        "doc": "",
        "group": "Math"
      },
      "tan": {
        "doc": "",
        "group": "Math"
      },
      "asin": {
        "doc": "",
        "group": "Math"
      },
      "acos": {
        "doc": "",
        "group": "Math"
      },
      "atan": {
        "doc": "",
        "group": "Math"
      },
      "min": {
        "doc": "",
        "group": "Math"
      },
      "max": {
        "doc": "",
        "group": "Math"
      },
      "==": {
        "doc": "",
        "group": "Decision"
      },
      "!=": {
        "doc": "",
        "group": "Decision"
      },
      ">": {
        "doc": "",
        "group": "Decision"
      },
      "<": {
        "doc": "",
        "group": "Decision"
      },
      ">=": {
        "doc": "",
        "group": "Decision"
      },
      "<=": {
        "doc": "",
        "group": "Decision"
      },
      "all": {
        "doc": "",
        "group": "Decision"
      },
      "any": {
        "doc": "",
        "group": "Decision"
      },
      "!": {
        "doc": "",
        "group": "Decision"
      },
      "upcase": {
        "doc": "",
        "group": "String"
      },
      "downcase": {
        "doc": "",
        "group": "String"
      },
      "concat": {
        "doc": "Concetenate the given strings.",
        "group": "String"
      }
    }
  },
  "light": {
    "anchor": {
      "type": "enum",
      "default": "viewport",
      "values": {
        "map": {
          "doc": "The position of the light source is aligned to the rotation of the map."
        },
        "viewport": {
          "doc": "The position of the light source is aligned to the rotation of the viewport."
        }
      },
      "transition": false,
      "zoom-function": true,
      "property-function": false,
      "function": "piecewise-constant",
      "doc": "Whether extruded geometries are lit relative to the map or viewport.",
      "example": "map",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "position": {
      "type": "array",
      "default": [1.15, 210, 30],
      "length": 3,
      "value": "number",
      "transition": true,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "doc": "Position of the light source relative to lit (extruded) geometries, in [r radial coordinate, a azimuthal angle, p polar angle] where r indicates the distance from the center of the base of an object to its light, a indicates the position of the light relative to 0° (0° when `light.anchor` is set to `viewport` corresponds to the top of the viewport, or 0° when `light.anchor` is set to `map` corresponds to due north, and degrees proceed clockwise), and p indicates the height of the light (from 0°, directly above, to 180°, directly below).",
      "example": [1.5, 90, 80],
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "color": {
      "type": "color",
      "default": "#ffffff",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "doc": "Color tint for lighting extruded geometries.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "intensity": {
      "type": "number",
      "default": 0.5,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "doc": "Intensity of lighting (on a scale from 0 to 1). Higher numbers will present as more extreme contrast.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    }
  },
  "paint": [
    "paint_fill",
    "paint_line",
    "paint_circle",
    "paint_heatmap",
    "paint_fill-extrusion",
    "paint_symbol",
    "paint_raster",
    "paint_background"
  ],
  "paint_fill": {
    "fill-antialias": {
      "type": "boolean",
      "function": "piecewise-constant",
      "zoom-function": true,
      "default": true,
      "doc": "Whether or not the fill should be antialiased.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-opacity": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity of the entire fill layer. In contrast to the `fill-color`, this value will also affect the 1px stroke around the fill, if the stroke is used.",
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.21.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "fill-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color of the filled part of this layer. This color can be specified as `rgba` with an alpha component and the color's opacity will not affect the opacity of the 1px stroke, if it is used.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        {
          "!": "fill-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.19.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "fill-outline-color": {
      "type": "color",
      "doc": "The outline color of the fill. Matches the value of `fill-color` if unspecified.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        {
          "!": "fill-pattern"
        },
        {
          "fill-antialias": true
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.19.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "fill-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The fill is translated relative to the map."
        },
        "viewport": {
            "doc": "The fill is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `fill-translate`.",
      "default": "map",
      "requires": [
        "fill-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-pattern": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "transition": true,
      "doc": "Name of image in sprite to use for drawing image fills. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512).",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_fill-extrusion": {
    "fill-extrusion-opacity": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity of the entire fill extrusion layer. This is rendered on a per-layer, not per-feature, basis, and data-driven styling is not available.",
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "fill-extrusion-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The base color of the extruded fill. The extrusion's surfaces will be shaded differently based on this color in combination with the root `light` settings. If this color is specified as `rgba` with an alpha component, the alpha component will be ignored; use `fill-extrusion-opacity` to set layer opacity.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        {
          "!": "fill-extrusion-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "fill-extrusion-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up (on the flat plane), respectively.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-extrusion-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The fill extrusion is translated relative to the map."
        },
        "viewport": {
            "doc": "The fill extrusion is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `fill-extrusion-translate`.",
      "default": "map",
      "requires": [
        "fill-extrusion-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-extrusion-pattern": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "transition": true,
      "doc": "Name of image in sprite to use for drawing images on extruded fills. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512).",
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {}
      }
    },
    "fill-extrusion-height": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "default": 0,
      "minimum": 0,
      "units": "meters",
      "doc": "The height with which to extrude this layer.",
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    },
    "fill-extrusion-base": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "default": 0,
      "minimum": 0,
      "units": "meters",
      "doc": "The height with which to extrude the base of this layer. Must be less than or equal to `fill-extrusion-height`.",
      "transition": true,
      "requires": [
        "fill-extrusion-height"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        },
        "data-driven styling": {
          "js": "0.27.0",
          "android": "5.1.0",
          "ios": "3.6.0",
          "macos": "0.5.0"
        }
      }
    }
  },
  "paint_line": {
    "line-opacity": {
      "type": "number",
      "doc": "The opacity at which the line will be drawn.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-color": {
      "type": "color",
      "doc": "The color with which the line will be drawn.",
      "default": "#000000",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        {
          "!": "line-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.23.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The line is translated relative to the map."
        },
        "viewport": {
            "doc": "The line is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `line-translate`.",
      "default": "map",
      "requires": [
        "line-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-width": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Stroke thickness.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.39.0"
        }
      }
    },
    "line-gap-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "doc": "Draws a line casing outside of a line's actual path. Value indicates the width of the inner gap.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-offset": {
      "type": "number",
      "default": 0,
      "doc": "The line's offset. For linear features, a positive value offsets the line to the right, relative to the direction of the line, and a negative value to the left. For polygon features, a positive value results in an inset, and a negative value results in an outset.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "sdk-support": {
        "basic functionality": {
          "js": "0.12.1",
          "android": "3.0.0",
          "ios": "3.1.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Blur applied to the line, in pixels.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "line-dasharray": {
      "type": "array",
      "value": "number",
      "function": "piecewise-constant",
      "zoom-function": true,
      "doc": "Specifies the lengths of the alternating dashes and gaps that form the dash pattern. The lengths are later scaled by the line width. To convert a dash length to pixels, multiply the length by the current line width.",
      "minimum": 0,
      "transition": true,
      "units": "line widths",
      "requires": [
        {
          "!": "line-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "line-pattern": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "transition": true,
      "doc": "Name of image in sprite to use for drawing image lines. For seamless patterns, image width must be a factor of two (2, 4, 8, ..., 512).",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_circle": {
    "circle-radius": {
      "type": "number",
      "default": 5,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Circle radius.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.18.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The fill color of the circle.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.18.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-blur": {
      "type": "number",
      "default": 0,
      "doc": "Amount to blur the circle. 1 blurs the circle such that only the centerpoint is full opacity.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.20.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-opacity": {
      "type": "number",
      "doc": "The opacity at which the circle will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.20.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [0, 0],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "circle-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The circle is translated relative to the map."
        },
        "viewport": {
            "doc": "The circle is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `circle-translate`.",
      "default": "map",
      "requires": [
        "circle-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "circle-pitch-scale": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "Circles are scaled according to their apparent distance to the camera."
        },
        "viewport": {
            "doc": "Circles are not scaled."
        }
      },
      "default": "map",
      "doc": "Controls the scaling behavior of the circle when the map is pitched.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.21.0",
          "android": "4.2.0",
          "ios": "3.4.0",
          "macos": "0.2.1"
        },
        "data-driven styling": {}
      }
    },
    "circle-pitch-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The circle is aligned to the plane of the map."
        },
        "viewport": {
            "doc": "The circle is aligned to the plane of the viewport."
        }
      },
      "default": "viewport",
      "doc": "Orientation of circle when map is pitched.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.39.0"
        },
        "data-driven styling": {}
      }
    },
    "circle-stroke-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The width of the circle's stroke. Strokes are placed outside of the `circle-radius`.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-stroke-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The stroke color of the circle.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "circle-stroke-opacity": {
      "type": "number",
      "doc": "The opacity of the circle's stroke.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        },
        "data-driven styling": {
          "js": "0.29.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    }
  },
  "paint_heatmap": {
    "heatmap-radius": {
      "type": "number",
      "default": 30,
      "minimum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "units": "pixels",
      "doc": "Radius of influence of one heatmap point in pixels. Increasing the value makes the heatmap smoother, but less detailed.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {}
      }
    },
    "heatmap-weight": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": false,
      "doc": "A measure of how much an individual point contributes to the heatmap. A value of 10 would be equivalent to having 10 points of weight 1 in the same spot. Especially useful when combined with clustering.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {
          "js": "0.41.0"
        }
      }
    },
    "heatmap-intensity": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "doc": "Similar to `heatmap-weight` but controls the intensity of the heatmap globally. Primarily used for adjusting the heatmap based on zoom level.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {}
      }
    },
    "heatmap-color": {
      "type": "color",
      "default": {
          "stops": [
              [0, "rgba(0, 0, 255, 0)"],
              [0.1, "royalblue"],
              [0.3, "cyan"],
              [0.5, "lime"],
              [0.7, "yellow"],
              [1, "red"]
          ]
      },
      "doc": "Defines the color of each pixel based on its density value in a heatmap. Should be either a stop function with input values ranging from `0` to `1`, or an expression which uses `[\"heatmap-density\"]`.",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {}
      }
    },
    "heatmap-opacity": {
      "type": "number",
      "doc": "The global opacity at which the heatmap layer will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": false,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.41.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_symbol": {
    "icon-opacity": {
      "doc": "The opacity at which the icon will be drawn.",
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-color": {
      "type": "color",
      "default": "#000000",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "doc": "The color of the icon. This can only be used with sdf icons.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "doc": "The color of the icon's halo. Icon halos can only be used with SDF icons.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the icon outline.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Fade out the halo towards the outside.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "icon-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance that the icon's anchor is moved from its original placement. Positive values indicate right and down, while negative values indicate left and up.",
      "requires": [
        "icon-image"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "icon-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "Icons are translated relative to the map."
        },
        "viewport": {
            "doc": "Icons are translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `icon-translate`.",
      "default": "map",
      "requires": [
        "icon-image",
        "icon-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-opacity": {
      "type": "number",
      "doc": "The opacity at which the text will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-color": {
      "type": "color",
      "doc": "The color with which the text will be drawn.",
      "default": "#000000",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "doc": "The color of the text's halo, which helps it stand out from backgrounds.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the font outline. Max text halo width is 1/4 of the font-size.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "property-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "The halo's fadeout distance towards the outside.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {
          "js": "0.33.0",
          "android": "5.0.0",
          "ios": "3.5.0",
          "macos": "0.4.0"
        }
      }
    },
    "text-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "pixels",
      "doc": "Distance that the text's anchor is moved from its original placement. Positive values indicate right and down, while negative values indicate left and up.",
      "requires": [
        "text-field"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "text-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "zoom-function": true,
      "values": {
        "map": {
            "doc": "The text is translated relative to the map."
        },
        "viewport": {
            "doc": "The text is translated relative to the viewport."
        }
      },
      "doc": "Controls the frame of reference for `text-translate`.",
      "default": "map",
      "requires": [
        "text-field",
        "text-translate"
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_raster": {
    "raster-opacity": {
      "type": "number",
      "doc": "The opacity at which the image will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-hue-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "degrees",
      "doc": "Rotates hues around the color wheel.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-brightness-min": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Increase or reduce the brightness of the image. The value is the minimum brightness.",
      "default": 0,
      "minimum": 0,
      "maximum": 1,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-brightness-max": {
      "type": "number",
      "function": "interpolated",
      "zoom-function": true,
      "doc": "Increase or reduce the brightness of the image. The value is the maximum brightness.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-saturation": {
      "type": "number",
      "doc": "Increase or reduce the saturation of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-contrast": {
      "type": "number",
      "doc": "Increase or reduce the contrast of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    },
    "raster-fade-duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "units": "milliseconds",
      "doc": "Fade duration when a new tile is added.",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        },
        "data-driven styling": {}
      }
    }
  },
  "paint_background": {
    "background-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color with which the background will be drawn.",
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "requires": [
        {
          "!": "background-pattern"
        }
      ],
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    },
    "background-pattern": {
      "type": "string",
      "function": "piecewise-constant",
      "zoom-function": true,
      "transition": true,
      "doc": "Name of image in sprite to use for drawing an image background. For seamless patterns, image width and height must be a factor of two (2, 4, 8, ..., 512).",
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    },
    "background-opacity": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity at which the background will be drawn.",
      "function": "interpolated",
      "zoom-function": true,
      "transition": true,
      "sdk-support": {
        "basic functionality": {
          "js": "0.10.0",
          "android": "2.0.1",
          "ios": "2.0.0",
          "macos": "0.1.0"
        }
      }
    }
  },
  "transition": {
    "duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Time allotted for transitions to complete."
    },
    "delay": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Length of time before a transition begins."
    }
  }
}

},{}],41:[function(_dereq_,module,exports){
'use strict';
exports.v6 = _dereq_('./reference/v6.json');
exports.v7 = _dereq_('./reference/v7.json');
exports.v8 = _dereq_('./reference/v8.json');
exports.latest = _dereq_('./reference/latest');

exports.format = _dereq_('./format');
exports.migrate = _dereq_('./migrate');
exports.composite = _dereq_('./composite');
exports.diff = _dereq_('./diff');
exports.ValidationError = _dereq_('./error/validation_error');
exports.ParsingError = _dereq_('./error/parsing_error');
exports.expression = _dereq_('./expression');
exports.featureFilter = _dereq_('./feature_filter');

exports.function = _dereq_('./function');
exports.function.convertFunction = _dereq_('./function/convert');

exports.validate = _dereq_('./validate_style');
exports.validate.parsed = _dereq_('./validate_style');
exports.validate.latest = _dereq_('./validate_style');

},{"./composite":1,"./diff":2,"./error/parsing_error":3,"./error/validation_error":4,"./expression":21,"./feature_filter":30,"./format":31,"./function":33,"./function/convert":32,"./migrate":34,"./reference/latest":37,"./reference/v6.json":38,"./reference/v7.json":39,"./reference/v8.json":40,"./validate_style":67}],42:[function(_dereq_,module,exports){
'use strict';//      

var ref = _dereq_('csscolorparser');
var parseCSSColor = ref.parseCSSColor;

/**
 * An RGBA color value. All components are in the range [0, 1] and R, B, and G are premultiplied by A.
 * @private
 */
var Color = function Color(r    , g    , b    , a) {
    if ( a === void 0 ) a     = 1;

    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
};

Color.parse = function parse (input     )           {
    if (!input) {
        return undefined;
    }

    if (input instanceof Color) {
        return input;
    }

    if (typeof input !== 'string') {
        return undefined;
    }

    var rgba = parseCSSColor(input);
    if (!rgba) {
        return undefined;
    }

    return new Color(
        rgba[0] / 255 * rgba[3],
        rgba[1] / 255 * rgba[3],
        rgba[2] / 255 * rgba[3],
        rgba[3]
    );
};

module.exports = Color;

},{"csscolorparser":undefined}],43:[function(_dereq_,module,exports){
'use strict';//      

var Color = _dereq_('./color');

                 
              
              
              
                 
  

                 
              
              
              
                 
  

// Constants
var Xn = 0.950470, // D65 standard referent
    Yn = 1,
    Zn = 1.088830,
    t0 = 4 / 29,
    t1 = 6 / 29,
    t2 = 3 * t1 * t1,
    t3 = t1 * t1 * t1,
    deg2rad = Math.PI / 180,
    rad2deg = 180 / Math.PI;

// Utilities
function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
    return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
    x /= 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

// LAB
function rgbToLab(rgbColor       )           {
    var b = rgb2xyz(rgbColor.r),
        a = rgb2xyz(rgbColor.g),
        l = rgb2xyz(rgbColor.b),
        x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
        y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
        z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);

    return {
        l: 116 * y - 16,
        a: 500 * (x - y),
        b: 200 * (y - z),
        alpha: rgbColor.a
    };
}

function labToRgb(labColor          )        {
    var y = (labColor.l + 16) / 116,
        x = isNaN(labColor.a) ? y : y + labColor.a / 500,
        z = isNaN(labColor.b) ? y : y - labColor.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Color(
        xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
        xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
        xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
        labColor.alpha
    );
}

// HCL
function rgbToHcl(rgbColor       )           {
    var ref = rgbToLab(rgbColor);
    var l = ref.l;
    var a = ref.a;
    var b = ref.b;
    var h = Math.atan2(b, a) * rad2deg;
    return {
        h: h < 0 ? h + 360 : h,
        c: Math.sqrt(a * a + b * b),
        l: l,
        alpha: rgbColor.a
    };
}

function hclToRgb(hclColor          )        {
    var h = hclColor.h * deg2rad,
        c = hclColor.c,
        l = hclColor.l;
    return labToRgb({
        l: l,
        a: Math.cos(h) * c,
        b: Math.sin(h) * c,
        alpha: hclColor.alpha
    });
}

module.exports = {
    lab: {
        forward: rgbToLab,
        reverse: labToRgb
    },
    hcl: {
        forward: rgbToHcl,
        reverse: hclToRgb
    }
};

},{"./color":42}],44:[function(_dereq_,module,exports){
'use strict';
module.exports = function (output) {
    var inputs = [], len = arguments.length - 1;
    while ( len-- > 0 ) inputs[ len ] = arguments[ len + 1 ];

    for (var i = 0, list = inputs; i < list.length; i += 1) {
        var input = list[i];

        for (var k in input) {
            output[k] = input[k];
        }
    }
    return output;
};

},{}],45:[function(_dereq_,module,exports){
'use strict';
module.exports = function getType(val) {
    if (val instanceof Number) {
        return 'number';
    } else if (val instanceof String) {
        return 'string';
    } else if (val instanceof Boolean) {
        return 'boolean';
    } else if (Array.isArray(val)) {
        return 'array';
    } else if (val === null) {
        return 'null';
    } else {
        return typeof val;
    }
};

},{}],46:[function(_dereq_,module,exports){
'use strict';//      

var Color = _dereq_('./color');

module.exports = interpolate;

function interpolate(a        , b        , t        ) {
    return (a * (1 - t)) + (b * t);
}

interpolate.number = interpolate;

interpolate.vec2 = function(from                  , to                  , t        ) {
    return [
        interpolate(from[0], to[0], t),
        interpolate(from[1], to[1], t)
    ];
};

interpolate.color = function(from       , to       , t        ) {
    return new Color(
        interpolate(from.r, to.r, t),
        interpolate(from.g, to.g, t),
        interpolate(from.b, to.b, t),
        interpolate(from.a, to.a, t)
    );
};

interpolate.array = function(from               , to               , t        ) {
    return from.map(function (d, i) {
        return interpolate(d, to[i], t);
    });
};

},{"./color":42}],47:[function(_dereq_,module,exports){
'use strict';
// Turn jsonlint-lines-primitives objects into primitive objects
function unbundle(value) {
    if (value instanceof Number || value instanceof String || value instanceof Boolean) {
        return value.valueOf();
    } else {
        return value;
    }
}

function deepUnbundle(value) {
    if (Array.isArray(value)) {
        return value.map(deepUnbundle);
    }
    return unbundle(value);
}

module.exports = unbundle;
module.exports.deep = deepUnbundle;

},{}],48:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var getType = _dereq_('../util/get_type');
var extend = _dereq_('../util/extend');
var unbundle = _dereq_('../util/unbundle_jsonlint');
var ref = _dereq_('../expression');
var isExpression = ref.isExpression;
var ref$1 = _dereq_('../function');
var isFunction = ref$1.isFunction;

// Main recursive validation function. Tracks:
//
// - key: string representing location of validation in style tree. Used only
//   for more informative error reporting.
// - value: current value from style being evaluated. May be anything from a
//   high level object that needs to be descended into deeper or a simple
//   scalar value.
// - valueSpec: current spec being evaluated. Tracks value.

module.exports = function validate(options) {

    var validateFunction = _dereq_('./validate_function');
    var validateExpression = _dereq_('./validate_expression');
    var validateObject = _dereq_('./validate_object');
    var VALIDATORS = {
        '*': function() {
            return [];
        },
        'array': _dereq_('./validate_array'),
        'boolean': _dereq_('./validate_boolean'),
        'number': _dereq_('./validate_number'),
        'color': _dereq_('./validate_color'),
        'constants': _dereq_('./validate_constants'),
        'enum': _dereq_('./validate_enum'),
        'filter': _dereq_('./validate_filter'),
        'function': _dereq_('./validate_function'),
        'layer': _dereq_('./validate_layer'),
        'object': _dereq_('./validate_object'),
        'source': _dereq_('./validate_source'),
        'light': _dereq_('./validate_light'),
        'string': _dereq_('./validate_string')
    };

    var value = options.value;
    var valueSpec = options.valueSpec;
    var key = options.key;
    var styleSpec = options.styleSpec;
    var style = options.style;

    if (getType(value) === 'string' && value[0] === '@') {
        if (styleSpec.$version > 7) {
            return [new ValidationError(key, value, 'constants have been deprecated as of v8')];
        }
        if (!(value in style.constants)) {
            return [new ValidationError(key, value, 'constant "%s" not found', value)];
        }
        options = extend({}, options, { value: style.constants[value] });
    }

    if (valueSpec.function && isFunction(unbundle(value))) {
        return validateFunction(options);

    } else if (valueSpec.function && isExpression(unbundle.deep(value))) {
        return validateExpression(options);

    } else if (valueSpec.type && VALIDATORS[valueSpec.type]) {
        return VALIDATORS[valueSpec.type](options);

    } else {
        return validateObject(extend({}, options, {
            valueSpec: valueSpec.type ? styleSpec[valueSpec.type] : valueSpec
        }));
    }
};

},{"../error/validation_error":4,"../expression":21,"../function":33,"../util/extend":44,"../util/get_type":45,"../util/unbundle_jsonlint":47,"./validate_array":49,"./validate_boolean":50,"./validate_color":51,"./validate_constants":52,"./validate_enum":53,"./validate_expression":54,"./validate_filter":55,"./validate_function":56,"./validate_layer":58,"./validate_light":60,"./validate_number":61,"./validate_object":62,"./validate_source":65,"./validate_string":66}],49:[function(_dereq_,module,exports){
'use strict';
var getType = _dereq_('../util/get_type');
var validate = _dereq_('./validate');
var ValidationError = _dereq_('../error/validation_error');

module.exports = function validateArray(options) {
    var array = options.value;
    var arraySpec = options.valueSpec;
    var style = options.style;
    var styleSpec = options.styleSpec;
    var key = options.key;
    var validateArrayElement = options.arrayElementValidator || validate;

    if (getType(array) !== 'array') {
        return [new ValidationError(key, array, 'array expected, %s found', getType(array))];
    }

    if (arraySpec.length && array.length !== arraySpec.length) {
        return [new ValidationError(key, array, 'array length %d expected, length %d found', arraySpec.length, array.length)];
    }

    if (arraySpec['min-length'] && array.length < arraySpec['min-length']) {
        return [new ValidationError(key, array, 'array length at least %d expected, length %d found', arraySpec['min-length'], array.length)];
    }

    var arrayElementSpec = {
        "type": arraySpec.value
    };

    if (styleSpec.$version < 7) {
        arrayElementSpec.function = arraySpec.function;
    }

    if (getType(arraySpec.value) === 'object') {
        arrayElementSpec = arraySpec.value;
    }

    var errors = [];
    for (var i = 0; i < array.length; i++) {
        errors = errors.concat(validateArrayElement({
            array: array,
            arrayIndex: i,
            value: array[i],
            valueSpec: arrayElementSpec,
            style: style,
            styleSpec: styleSpec,
            key: (key + "[" + i + "]")
        }));
    }
    return errors;
};

},{"../error/validation_error":4,"../util/get_type":45,"./validate":48}],50:[function(_dereq_,module,exports){
'use strict';
var getType = _dereq_('../util/get_type');
var ValidationError = _dereq_('../error/validation_error');

module.exports = function validateBoolean(options) {
    var value = options.value;
    var key = options.key;
    var type = getType(value);

    if (type !== 'boolean') {
        return [new ValidationError(key, value, 'boolean expected, %s found', type)];
    }

    return [];
};

},{"../error/validation_error":4,"../util/get_type":45}],51:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var getType = _dereq_('../util/get_type');
var parseCSSColor = _dereq_('csscolorparser').parseCSSColor;

module.exports = function validateColor(options) {
    var key = options.key;
    var value = options.value;
    var type = getType(value);

    if (type !== 'string') {
        return [new ValidationError(key, value, 'color expected, %s found', type)];
    }

    if (parseCSSColor(value) === null) {
        return [new ValidationError(key, value, 'color expected, "%s" found', value)];
    }

    return [];
};

},{"../error/validation_error":4,"../util/get_type":45,"csscolorparser":undefined}],52:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var getType = _dereq_('../util/get_type');

module.exports = function validateConstants(options) {
    var key = options.key;
    var constants = options.value;
    var styleSpec = options.styleSpec;

    if (styleSpec.$version > 7) {
        if (constants) {
            return [new ValidationError(key, constants, 'constants have been deprecated as of v8')];
        } else {
            return [];
        }
    } else {
        var type = getType(constants);
        if (type !== 'object') {
            return [new ValidationError(key, constants, 'object expected, %s found', type)];
        }

        var errors = [];
        for (var constantName in constants) {
            if (constantName[0] !== '@') {
                errors.push(new ValidationError((key + "." + constantName), constants[constantName], 'constants must start with "@"'));
            }
        }
        return errors;
    }

};

},{"../error/validation_error":4,"../util/get_type":45}],53:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var unbundle = _dereq_('../util/unbundle_jsonlint');

module.exports = function validateEnum(options) {
    var key = options.key;
    var value = options.value;
    var valueSpec = options.valueSpec;
    var errors = [];

    if (Array.isArray(valueSpec.values)) { // <=v7
        if (valueSpec.values.indexOf(unbundle(value)) === -1) {
            errors.push(new ValidationError(key, value, 'expected one of [%s], %s found', valueSpec.values.join(', '), JSON.stringify(value)));
        }
    } else { // >=v8
        if (Object.keys(valueSpec.values).indexOf(unbundle(value)) === -1) {
            errors.push(new ValidationError(key, value, 'expected one of [%s], %s found', Object.keys(valueSpec.values).join(', '), JSON.stringify(value)));
        }
    }
    return errors;
};

},{"../error/validation_error":4,"../util/unbundle_jsonlint":47}],54:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var ref = _dereq_('../expression');
var createExpression = ref.createExpression;
var unbundle = _dereq_('../util/unbundle_jsonlint');

module.exports = function validateExpression(options) {
    var expression = createExpression(unbundle.deep(options.value), options.valueSpec, options.expressionContext);
    if (expression.result === 'success') {
        return [];
    }

    return expression.errors.map(function (error) {
        return new ValidationError(("" + (options.key) + (error.key)), options.value, error.message);
    });
};

},{"../error/validation_error":4,"../expression":21,"../util/unbundle_jsonlint":47}],55:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var validateExpression = _dereq_('./validate_expression');
var validateEnum = _dereq_('./validate_enum');
var getType = _dereq_('../util/get_type');
var unbundle = _dereq_('../util/unbundle_jsonlint');
var extend = _dereq_('../util/extend');
var ref = _dereq_('../feature_filter');
var isExpressionFilter = ref.isExpressionFilter;

module.exports = function validateFilter(options) {
    var value = options.value;
    var key = options.key;
    var styleSpec = options.styleSpec;
    var type;

    var errors = [];

    if (getType(value) !== 'array') {
        return [new ValidationError(key, value, 'array expected, %s found', getType(value))];
    }

    if (isExpressionFilter(unbundle.deep(value))) {
        return validateExpression(extend({}, options, {
            expressionContext: 'filter',
            valueSpec: { value: 'boolean' }
        }));
    }

    if (value.length < 1) {
        return [new ValidationError(key, value, 'filter array must have at least 1 element')];
    }

    errors = errors.concat(validateEnum({
        key: (key + "[0]"),
        value: value[0],
        valueSpec: styleSpec.filter_operator,
        style: options.style,
        styleSpec: options.styleSpec
    }));

    switch (unbundle(value[0])) {
    case '<':
    case '<=':
    case '>':
    case '>=':
        if (value.length >= 2 && unbundle(value[1]) === '$type') {
            errors.push(new ValidationError(key, value, '"$type" cannot be use with operator "%s"', value[0]));
        }
        /* falls through */
    case '==':
    case '!=':
        if (value.length !== 3) {
            errors.push(new ValidationError(key, value, 'filter array for operator "%s" must have 3 elements', value[0]));
        }
        /* falls through */
    case 'in':
    case '!in':
        if (value.length >= 2) {
            type = getType(value[1]);
            if (type !== 'string') {
                errors.push(new ValidationError((key + "[1]"), value[1], 'string expected, %s found', type));
            }
        }
        for (var i = 2; i < value.length; i++) {
            type = getType(value[i]);
            if (unbundle(value[1]) === '$type') {
                errors = errors.concat(validateEnum({
                    key: (key + "[" + i + "]"),
                    value: value[i],
                    valueSpec: styleSpec.geometry_type,
                    style: options.style,
                    styleSpec: options.styleSpec
                }));
            } else if (type !== 'string' && type !== 'number' && type !== 'boolean') {
                errors.push(new ValidationError((key + "[" + i + "]"), value[i], 'string, number, or boolean expected, %s found', type));
            }
        }
        break;

    case 'any':
    case 'all':
    case 'none':
        for (var i$1 = 1; i$1 < value.length; i$1++) {
            errors = errors.concat(validateFilter({
                key: (key + "[" + i$1 + "]"),
                value: value[i$1],
                style: options.style,
                styleSpec: options.styleSpec
            }));
        }
        break;

    case 'has':
    case '!has':
        type = getType(value[1]);
        if (value.length !== 2) {
            errors.push(new ValidationError(key, value, 'filter array for "%s" operator must have 2 elements', value[0]));
        } else if (type !== 'string') {
            errors.push(new ValidationError((key + "[1]"), value[1], 'string expected, %s found', type));
        }
        break;

    }

    return errors;
};

},{"../error/validation_error":4,"../feature_filter":30,"../util/extend":44,"../util/get_type":45,"../util/unbundle_jsonlint":47,"./validate_enum":53,"./validate_expression":54}],56:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var getType = _dereq_('../util/get_type');
var validate = _dereq_('./validate');
var validateObject = _dereq_('./validate_object');
var validateArray = _dereq_('./validate_array');
var validateNumber = _dereq_('./validate_number');
var unbundle = _dereq_('../util/unbundle_jsonlint');

module.exports = function validateFunction(options) {
    var functionValueSpec = options.valueSpec;
    var functionType = unbundle(options.value.type);
    var stopKeyType;
    var stopDomainValues = {};
    var previousStopDomainValue;
    var previousStopDomainZoom;

    var isZoomFunction = functionType !== 'categorical' && options.value.property === undefined;
    var isPropertyFunction = !isZoomFunction;
    var isZoomAndPropertyFunction =
        getType(options.value.stops) === 'array' &&
        getType(options.value.stops[0]) === 'array' &&
        getType(options.value.stops[0][0]) === 'object';

    var errors = validateObject({
        key: options.key,
        value: options.value,
        valueSpec: options.styleSpec.function,
        style: options.style,
        styleSpec: options.styleSpec,
        objectElementValidators: {
            stops: validateFunctionStops,
            default: validateFunctionDefault
        }
    });

    if (functionType === 'identity' && isZoomFunction) {
        errors.push(new ValidationError(options.key, options.value, 'missing required property "property"'));
    }

    if (functionType !== 'identity' && !options.value.stops) {
        errors.push(new ValidationError(options.key, options.value, 'missing required property "stops"'));
    }

    if (functionType === 'exponential' && options.valueSpec['function'] === 'piecewise-constant') {
        errors.push(new ValidationError(options.key, options.value, 'exponential functions not supported'));
    }

    if (options.styleSpec.$version >= 8) {
        if (isPropertyFunction && !options.valueSpec['property-function']) {
            errors.push(new ValidationError(options.key, options.value, 'property functions not supported'));
        } else if (isZoomFunction && !options.valueSpec['zoom-function']) {
            errors.push(new ValidationError(options.key, options.value, 'zoom functions not supported'));
        }
    }

    if ((functionType === 'categorical' || isZoomAndPropertyFunction) && options.value.property === undefined) {
        errors.push(new ValidationError(options.key, options.value, '"property" property is required'));
    }

    return errors;

    function validateFunctionStops(options) {
        if (functionType === 'identity') {
            return [new ValidationError(options.key, options.value, 'identity function may not have a "stops" property')];
        }

        var errors = [];
        var value = options.value;

        errors = errors.concat(validateArray({
            key: options.key,
            value: value,
            valueSpec: options.valueSpec,
            style: options.style,
            styleSpec: options.styleSpec,
            arrayElementValidator: validateFunctionStop
        }));

        if (getType(value) === 'array' && value.length === 0) {
            errors.push(new ValidationError(options.key, value, 'array must have at least one stop'));
        }

        return errors;
    }

    function validateFunctionStop(options) {
        var errors = [];
        var value = options.value;
        var key = options.key;

        if (getType(value) !== 'array') {
            return [new ValidationError(key, value, 'array expected, %s found', getType(value))];
        }

        if (value.length !== 2) {
            return [new ValidationError(key, value, 'array length %d expected, length %d found', 2, value.length)];
        }

        if (isZoomAndPropertyFunction) {
            if (getType(value[0]) !== 'object') {
                return [new ValidationError(key, value, 'object expected, %s found', getType(value[0]))];
            }
            if (value[0].zoom === undefined) {
                return [new ValidationError(key, value, 'object stop key must have zoom')];
            }
            if (value[0].value === undefined) {
                return [new ValidationError(key, value, 'object stop key must have value')];
            }
            if (previousStopDomainZoom && previousStopDomainZoom > unbundle(value[0].zoom)) {
                return [new ValidationError(key, value[0].zoom, 'stop zoom values must appear in ascending order')];
            }
            if (unbundle(value[0].zoom) !== previousStopDomainZoom) {
                previousStopDomainZoom = unbundle(value[0].zoom);
                previousStopDomainValue = undefined;
                stopDomainValues = {};
            }
            errors = errors.concat(validateObject({
                key: (key + "[0]"),
                value: value[0],
                valueSpec: { zoom: {} },
                style: options.style,
                styleSpec: options.styleSpec,
                objectElementValidators: { zoom: validateNumber, value: validateStopDomainValue }
            }));
        } else {
            errors = errors.concat(validateStopDomainValue({
                key: (key + "[0]"),
                value: value[0],
                valueSpec: {},
                style: options.style,
                styleSpec: options.styleSpec
            }, value));
        }

        return errors.concat(validate({
            key: (key + "[1]"),
            value: value[1],
            valueSpec: functionValueSpec,
            style: options.style,
            styleSpec: options.styleSpec
        }));
    }

    function validateStopDomainValue(options, stop) {
        var type = getType(options.value);
        var value = unbundle(options.value);

        var reportValue = options.value !== null ? options.value : stop;

        if (!stopKeyType) {
            stopKeyType = type;
        } else if (type !== stopKeyType) {
            return [new ValidationError(options.key, reportValue, '%s stop domain type must match previous stop domain type %s', type, stopKeyType)];
        }

        if (type !== 'number' && type !== 'string' && type !== 'boolean') {
            return [new ValidationError(options.key, reportValue, 'stop domain value must be a number, string, or boolean')];
        }

        if (type !== 'number' && functionType !== 'categorical') {
            var message = 'number expected, %s found';
            if (functionValueSpec['property-function'] && functionType === undefined) {
                message += '\nIf you intended to use a categorical function, specify `"type": "categorical"`.';
            }
            return [new ValidationError(options.key, reportValue, message, type)];
        }

        if (functionType === 'categorical' && type === 'number' && (!isFinite(value) || Math.floor(value) !== value)) {
            return [new ValidationError(options.key, reportValue, 'integer expected, found %s', value)];
        }

        if (functionType !== 'categorical' && type === 'number' && previousStopDomainValue !== undefined && value < previousStopDomainValue) {
            return [new ValidationError(options.key, reportValue, 'stop domain values must appear in ascending order')];
        } else {
            previousStopDomainValue = value;
        }

        if (functionType === 'categorical' && value in stopDomainValues) {
            return [new ValidationError(options.key, reportValue, 'stop domain values must be unique')];
        } else {
            stopDomainValues[value] = true;
        }

        return [];
    }

    function validateFunctionDefault(options) {
        return validate({
            key: options.key,
            value: options.value,
            valueSpec: functionValueSpec,
            style: options.style,
            styleSpec: options.styleSpec
        });
    }
};

},{"../error/validation_error":4,"../util/get_type":45,"../util/unbundle_jsonlint":47,"./validate":48,"./validate_array":49,"./validate_number":61,"./validate_object":62}],57:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var validateString = _dereq_('./validate_string');

module.exports = function(options) {
    var value = options.value;
    var key = options.key;

    var errors = validateString(options);
    if (errors.length) { return errors; }

    if (value.indexOf('{fontstack}') === -1) {
        errors.push(new ValidationError(key, value, '"glyphs" url must include a "{fontstack}" token'));
    }

    if (value.indexOf('{range}') === -1) {
        errors.push(new ValidationError(key, value, '"glyphs" url must include a "{range}" token'));
    }

    return errors;
};

},{"../error/validation_error":4,"./validate_string":66}],58:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var unbundle = _dereq_('../util/unbundle_jsonlint');
var validateObject = _dereq_('./validate_object');
var validateFilter = _dereq_('./validate_filter');
var validatePaintProperty = _dereq_('./validate_paint_property');
var validateLayoutProperty = _dereq_('./validate_layout_property');
var extend = _dereq_('../util/extend');

module.exports = function validateLayer(options) {
    var errors = [];

    var layer = options.value;
    var key = options.key;
    var style = options.style;
    var styleSpec = options.styleSpec;

    if (!layer.type && !layer.ref) {
        errors.push(new ValidationError(key, layer, 'either "type" or "ref" is required'));
    }
    var type = unbundle(layer.type);
    var ref = unbundle(layer.ref);

    if (layer.id) {
        var layerId = unbundle(layer.id);
        for (var i = 0; i < options.arrayIndex; i++) {
            var otherLayer = style.layers[i];
            if (unbundle(otherLayer.id) === layerId) {
                errors.push(new ValidationError(key, layer.id, 'duplicate layer id "%s", previously used at line %d', layer.id, otherLayer.id.__line__));
            }
        }
    }

    if ('ref' in layer) {
        ['type', 'source', 'source-layer', 'filter', 'layout'].forEach(function (p) {
            if (p in layer) {
                errors.push(new ValidationError(key, layer[p], '"%s" is prohibited for ref layers', p));
            }
        });

        var parent;

        style.layers.forEach(function (layer) {
            if (unbundle(layer.id) === ref) { parent = layer; }
        });

        if (!parent) {
            errors.push(new ValidationError(key, layer.ref, 'ref layer "%s" not found', ref));
        } else if (parent.ref) {
            errors.push(new ValidationError(key, layer.ref, 'ref cannot reference another ref layer'));
        } else {
            type = unbundle(parent.type);
        }
    } else if (type !== 'background') {
        if (!layer.source) {
            errors.push(new ValidationError(key, layer, 'missing required property "source"'));
        } else {
            var source = style.sources && style.sources[layer.source];
            var sourceType = source && unbundle(source.type);
            if (!source) {
                errors.push(new ValidationError(key, layer.source, 'source "%s" not found', layer.source));
            } else if (sourceType === 'vector' && type === 'raster') {
                errors.push(new ValidationError(key, layer.source, 'layer "%s" requires a raster source', layer.id));
            } else if (sourceType === 'raster' && type !== 'raster') {
                errors.push(new ValidationError(key, layer.source, 'layer "%s" requires a vector source', layer.id));
            } else if (sourceType === 'vector' && !layer['source-layer']) {
                errors.push(new ValidationError(key, layer, 'layer "%s" must specify a "source-layer"', layer.id));
            }
        }
    }

    errors = errors.concat(validateObject({
        key: key,
        value: layer,
        valueSpec: styleSpec.layer,
        style: options.style,
        styleSpec: options.styleSpec,
        objectElementValidators: {
            '*': function() {
                return [];
            },
            filter: validateFilter,
            layout: function(options) {
                return validateObject({
                    layer: layer,
                    key: options.key,
                    value: options.value,
                    style: options.style,
                    styleSpec: options.styleSpec,
                    objectElementValidators: {
                        '*': function(options) {
                            return validateLayoutProperty(extend({layerType: type}, options));
                        }
                    }
                });
            },
            paint: function(options) {
                return validateObject({
                    layer: layer,
                    key: options.key,
                    value: options.value,
                    style: options.style,
                    styleSpec: options.styleSpec,
                    objectElementValidators: {
                        '*': function(options) {
                            return validatePaintProperty(extend({layerType: type}, options));
                        }
                    }
                });
            }
        }
    }));

    return errors;
};

},{"../error/validation_error":4,"../util/extend":44,"../util/unbundle_jsonlint":47,"./validate_filter":55,"./validate_layout_property":59,"./validate_object":62,"./validate_paint_property":63}],59:[function(_dereq_,module,exports){
'use strict';
var validateProperty = _dereq_('./validate_property');

module.exports = function validateLayoutProperty(options) {
    return validateProperty(options, 'layout');
};

},{"./validate_property":64}],60:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var getType = _dereq_('../util/get_type');
var validate = _dereq_('./validate');

module.exports = function validateLight(options) {
    var light = options.value;
    var styleSpec = options.styleSpec;
    var lightSpec = styleSpec.light;
    var style = options.style;

    var errors = [];

    var rootType = getType(light);
    if (light === undefined) {
        return errors;
    } else if (rootType !== 'object') {
        errors = errors.concat([new ValidationError('light', light, 'object expected, %s found', rootType)]);
        return errors;
    }

    for (var key in light) {
        var transitionMatch = key.match(/^(.*)-transition$/);

        if (transitionMatch && lightSpec[transitionMatch[1]] && lightSpec[transitionMatch[1]].transition) {
            errors = errors.concat(validate({
                key: key,
                value: light[key],
                valueSpec: styleSpec.transition,
                style: style,
                styleSpec: styleSpec
            }));
        } else if (lightSpec[key]) {
            errors = errors.concat(validate({
                key: key,
                value: light[key],
                valueSpec: lightSpec[key],
                style: style,
                styleSpec: styleSpec
            }));
        } else {
            errors = errors.concat([new ValidationError(key, light[key], 'unknown property "%s"', key)]);
        }
    }

    return errors;
};

},{"../error/validation_error":4,"../util/get_type":45,"./validate":48}],61:[function(_dereq_,module,exports){
'use strict';
var getType = _dereq_('../util/get_type');
var ValidationError = _dereq_('../error/validation_error');

module.exports = function validateNumber(options) {
    var key = options.key;
    var value = options.value;
    var valueSpec = options.valueSpec;
    var type = getType(value);

    if (type !== 'number') {
        return [new ValidationError(key, value, 'number expected, %s found', type)];
    }

    if ('minimum' in valueSpec && value < valueSpec.minimum) {
        return [new ValidationError(key, value, '%s is less than the minimum value %s', value, valueSpec.minimum)];
    }

    if ('maximum' in valueSpec && value > valueSpec.maximum) {
        return [new ValidationError(key, value, '%s is greater than the maximum value %s', value, valueSpec.maximum)];
    }

    return [];
};

},{"../error/validation_error":4,"../util/get_type":45}],62:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var getType = _dereq_('../util/get_type');
var validateSpec = _dereq_('./validate');

module.exports = function validateObject(options) {
    var key = options.key;
    var object = options.value;
    var elementSpecs = options.valueSpec || {};
    var elementValidators = options.objectElementValidators || {};
    var style = options.style;
    var styleSpec = options.styleSpec;
    var errors = [];

    var type = getType(object);
    if (type !== 'object') {
        return [new ValidationError(key, object, 'object expected, %s found', type)];
    }

    for (var objectKey in object) {
        var elementSpecKey = objectKey.split('.')[0]; // treat 'paint.*' as 'paint'
        var elementSpec = elementSpecs[elementSpecKey] || elementSpecs['*'];

        var validateElement = (void 0);
        if (elementValidators[elementSpecKey]) {
            validateElement = elementValidators[elementSpecKey];
        } else if (elementSpecs[elementSpecKey]) {
            validateElement = validateSpec;
        } else if (elementValidators['*']) {
            validateElement = elementValidators['*'];
        } else if (elementSpecs['*']) {
            validateElement = validateSpec;
        } else {
            errors.push(new ValidationError(key, object[objectKey], 'unknown property "%s"', objectKey));
            continue;
        }

        errors = errors.concat(validateElement({
            key: (key ? (key + ".") : key) + objectKey,
            value: object[objectKey],
            valueSpec: elementSpec,
            style: style,
            styleSpec: styleSpec,
            object: object,
            objectKey: objectKey
        }, object));
    }

    for (var elementSpecKey$1 in elementSpecs) {
        if (elementSpecs[elementSpecKey$1].required && elementSpecs[elementSpecKey$1]['default'] === undefined && object[elementSpecKey$1] === undefined) {
            errors.push(new ValidationError(key, object, 'missing required property "%s"', elementSpecKey$1));
        }
    }

    return errors;
};

},{"../error/validation_error":4,"../util/get_type":45,"./validate":48}],63:[function(_dereq_,module,exports){
'use strict';
var validateProperty = _dereq_('./validate_property');

module.exports = function validatePaintProperty(options) {
    return validateProperty(options, 'paint');
};

},{"./validate_property":64}],64:[function(_dereq_,module,exports){
'use strict';
var validate = _dereq_('./validate');
var ValidationError = _dereq_('../error/validation_error');
var getType = _dereq_('../util/get_type');

module.exports = function validateProperty(options, propertyType) {
    var key = options.key;
    var style = options.style;
    var styleSpec = options.styleSpec;
    var value = options.value;
    var propertyKey = options.objectKey;
    var layerSpec = styleSpec[(propertyType + "_" + (options.layerType))];

    if (!layerSpec) { return []; }

    var transitionMatch = propertyKey.match(/^(.*)-transition$/);
    if (propertyType === 'paint' && transitionMatch && layerSpec[transitionMatch[1]] && layerSpec[transitionMatch[1]].transition) {
        return validate({
            key: key,
            value: value,
            valueSpec: styleSpec.transition,
            style: style,
            styleSpec: styleSpec
        });
    }

    var valueSpec = options.valueSpec || layerSpec[propertyKey];
    if (!valueSpec) {
        return [new ValidationError(key, value, 'unknown property "%s"', propertyKey)];
    }

    var tokenMatch;
    if (getType(value) === 'string' && valueSpec['property-function'] && !valueSpec.tokens && (tokenMatch = /^{([^}]+)}$/.exec(value))) {
        return [new ValidationError(
            key, value,
            '"%s" does not support interpolation syntax\n' +
                'Use an identity property function instead: `{ "type": "identity", "property": %s` }`.',
            propertyKey, JSON.stringify(tokenMatch[1])
        )];
    }

    var errors = [];

    if (options.layerType === 'symbol') {
        if (propertyKey === 'text-field' && style && !style.glyphs) {
            errors.push(new ValidationError(key, value, 'use of "text-field" requires a style "glyphs" property'));
        }
    }

    return errors.concat(validate({
        key: options.key,
        value: value,
        valueSpec: valueSpec,
        style: style,
        styleSpec: styleSpec,
        expressionContext: 'property'
    }));
};

},{"../error/validation_error":4,"../util/get_type":45,"./validate":48}],65:[function(_dereq_,module,exports){
'use strict';
var ValidationError = _dereq_('../error/validation_error');
var unbundle = _dereq_('../util/unbundle_jsonlint');
var validateObject = _dereq_('./validate_object');
var validateEnum = _dereq_('./validate_enum');

module.exports = function validateSource(options) {
    var value = options.value;
    var key = options.key;
    var styleSpec = options.styleSpec;
    var style = options.style;

    if (!value.type) {
        return [new ValidationError(key, value, '"type" is required')];
    }

    var type = unbundle(value.type);
    var errors = [];

    switch (type) {
    case 'vector':
    case 'raster':
        errors = errors.concat(validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec.source_tile,
            style: options.style,
            styleSpec: styleSpec
        }));
        if ('url' in value) {
            for (var prop in value) {
                if (['type', 'url', 'tileSize'].indexOf(prop) < 0) {
                    errors.push(new ValidationError((key + "." + prop), value[prop], 'a source with a "url" property may not include a "%s" property', prop));
                }
            }
        }
        return errors;

    case 'geojson':
        return validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec.source_geojson,
            style: style,
            styleSpec: styleSpec
        });

    case 'video':
        return validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec.source_video,
            style: style,
            styleSpec: styleSpec
        });

    case 'image':
        return validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec.source_image,
            style: style,
            styleSpec: styleSpec
        });

    case 'canvas':
        return validateObject({
            key: key,
            value: value,
            valueSpec: styleSpec.source_canvas,
            style: style,
            styleSpec: styleSpec
        });

    default:
        return validateEnum({
            key: (key + ".type"),
            value: value.type,
            valueSpec: {values: ['vector', 'raster', 'geojson', 'video', 'image', 'canvas']},
            style: style,
            styleSpec: styleSpec
        });
    }
};

},{"../error/validation_error":4,"../util/unbundle_jsonlint":47,"./validate_enum":53,"./validate_object":62}],66:[function(_dereq_,module,exports){
'use strict';
var getType = _dereq_('../util/get_type');
var ValidationError = _dereq_('../error/validation_error');

module.exports = function validateString(options) {
    var value = options.value;
    var key = options.key;
    var type = getType(value);

    if (type !== 'string') {
        return [new ValidationError(key, value, 'string expected, %s found', type)];
    }

    return [];
};

},{"../error/validation_error":4,"../util/get_type":45}],67:[function(_dereq_,module,exports){
'use strict';
var validateStyleMin = _dereq_('./validate_style.min');
var ParsingError = _dereq_('./error/parsing_error');
var jsonlint = _dereq_('jsonlint-lines-primitives');

/**
 * Validate a Mapbox GL style against the style specification.
 *
 * @private
 * @alias validate
 * @param {Object|String|Buffer} style The style to be validated. If a `String`
 *     or `Buffer` is provided, the returned errors will contain line numbers.
 * @param {Object} [styleSpec] The style specification to validate against.
 *     If omitted, the spec version is inferred from the stylesheet.
 * @returns {Array<ValidationError|ParsingError>}
 * @example
 *   var validate = require('mapbox-gl-style-spec').validate;
 *   var style = fs.readFileSync('./style.json', 'utf8');
 *   var errors = validate(style);
 */

module.exports = function validateStyle(style, styleSpec) {
    var index = _dereq_('./style-spec');

    if (style instanceof String || typeof style === 'string' || style instanceof Buffer) {
        try {
            style = jsonlint.parse(style.toString());
        } catch (e) {
            return [new ParsingError(e)];
        }
    }

    styleSpec = styleSpec || index[("v" + (style.version))];

    return validateStyleMin(style, styleSpec);
};

exports.source = validateStyleMin.source;
exports.light = validateStyleMin.light;
exports.layer = validateStyleMin.layer;
exports.filter = validateStyleMin.filter;
exports.paintProperty = validateStyleMin.paintProperty;
exports.layoutProperty = validateStyleMin.layoutProperty;

},{"./error/parsing_error":3,"./style-spec":41,"./validate_style.min":68,"jsonlint-lines-primitives":undefined}],68:[function(_dereq_,module,exports){
'use strict';
var validateConstants = _dereq_('./validate/validate_constants');
var validate = _dereq_('./validate/validate');
var latestStyleSpec = _dereq_('./reference/latest');
var validateGlyphsURL = _dereq_('./validate/validate_glyphs_url');

/**
 * Validate a Mapbox GL style against the style specification. This entrypoint,
 * `mapbox-gl-style-spec/lib/validate_style.min`, is designed to produce as
 * small a browserify bundle as possible by omitting unnecessary functionality
 * and legacy style specifications.
 *
 * @private
 * @param {Object} style The style to be validated.
 * @param {Object} [styleSpec] The style specification to validate against.
 *     If omitted, the latest style spec is used.
 * @returns {Array<ValidationError>}
 * @example
 *   var validate = require('mapbox-gl-style-spec/lib/validate_style.min');
 *   var errors = validate(style);
 */
function validateStyleMin(style, styleSpec) {
    styleSpec = styleSpec || latestStyleSpec;

    var errors = [];

    errors = errors.concat(validate({
        key: '',
        value: style,
        valueSpec: styleSpec.$root,
        styleSpec: styleSpec,
        style: style,
        objectElementValidators: {
            glyphs: validateGlyphsURL,
            '*': function() {
                return [];
            }
        }
    }));

    if (styleSpec.$version > 7 && style.constants) {
        errors = errors.concat(validateConstants({
            key: 'constants',
            value: style.constants,
            style: style,
            styleSpec: styleSpec
        }));
    }

    return sortErrors(errors);
}

validateStyleMin.source = wrapCleanErrors(_dereq_('./validate/validate_source'));
validateStyleMin.light = wrapCleanErrors(_dereq_('./validate/validate_light'));
validateStyleMin.layer = wrapCleanErrors(_dereq_('./validate/validate_layer'));
validateStyleMin.filter = wrapCleanErrors(_dereq_('./validate/validate_filter'));
validateStyleMin.paintProperty = wrapCleanErrors(_dereq_('./validate/validate_paint_property'));
validateStyleMin.layoutProperty = wrapCleanErrors(_dereq_('./validate/validate_layout_property'));

function sortErrors(errors) {
    return [].concat(errors).sort(function (a, b) {
        return a.line - b.line;
    });
}

function wrapCleanErrors(inner) {
    return function() {
        return sortErrors(inner.apply(this, arguments));
    };
}

module.exports = validateStyleMin;

},{"./reference/latest":37,"./validate/validate":48,"./validate/validate_constants":52,"./validate/validate_filter":55,"./validate/validate_glyphs_url":57,"./validate/validate_layer":58,"./validate/validate_layout_property":59,"./validate/validate_light":60,"./validate/validate_paint_property":63,"./validate/validate_source":65}]},{},[41])(41);
});
