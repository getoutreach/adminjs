(function (global) {
    function require(file, parentModule) {
        if ({}.hasOwnProperty.call(require.cache, file))
            return require.cache[file];
        var resolved = require.resolve(file);
        if (!resolved)
            throw new Error('Failed to resolve module ' + file);
        var module$ = {
                id: file,
                require: require,
                filename: file,
                exports: {},
                loaded: false,
                parent: parentModule,
                children: []
            };
        if (parentModule)
            parentModule.children.push(module$);
        var dirname = file.slice(0, file.lastIndexOf('/') + 1);
        require.cache[file] = module$.exports;
        resolved.call(module$.exports, module$, module$.exports, dirname, file);
        module$.loaded = true;
        return require.cache[file] = module$.exports;
    }
    require.modules = {};
    require.cache = {};
    require.resolve = function (file) {
        return {}.hasOwnProperty.call(require.modules, file) ? require.modules[file] : void 0;
    };
    require.define = function (file, fn) {
        require.modules[file] = fn;
    };
    var process = function () {
            var cwd = '/';
            return {
                title: 'browser',
                version: 'v0.10.13',
                browser: true,
                env: {},
                argv: [],
                nextTick: global.setImmediate || function (fn) {
                    setTimeout(fn, 0);
                },
                cwd: function () {
                    return cwd;
                },
                chdir: function (dir) {
                    cwd = dir;
                }
            };
        }();
    require.define('/lib/index.js', function (module, exports, __dirname, __filename) {
        global.Ep = Ember.Namespace.create();
        require('/lib/version.js', module);
        require('/lib/initializer.js', module);
        require('/lib/model/index.js', module);
        require('/lib/session/index.js', module);
        require('/lib/serializer/index.js', module);
        require('/lib/local/index.js', module);
        require('/lib/rest/index.js', module);
    });
    require.define('/lib/rest/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/rest/rest_adapter.js', module);
        require('/lib/rest/rest_serializer.js', module);
    });
    require.define('/lib/rest/rest_serializer.js', function (module, exports, __dirname, __filename) {
        require('/lib/serializer/index.js', module);
        var get = Ember.get;
        Ep.RestSerializer = Ep.JsonSerializer.extend({
            keyForAttributeName: function (type, name) {
                return Ember.String.decamelize(name);
            },
            keyForBelongsTo: function (type, name) {
                var key = this.keyForAttributeName(type, name);
                if (this.embeddedType(type, name)) {
                    return key;
                }
                return key + '_id';
            },
            keyForHasMany: function (type, name) {
                var key = this.keyForAttributeName(type, name);
                if (this.embeddedType(type, name)) {
                    return key;
                }
                return this.singularize(key) + '_ids';
            },
            keyForPolymorphicId: function (key) {
                return key;
            },
            keyForPolymorphicType: function (key) {
                return key.replace(/_id$/, '_type');
            },
            extractValidationErrors: function (type, json) {
                var errors = {};
                get(type, 'attributes').forEach(function (name) {
                    var key = this._keyForAttributeName(type, name);
                    if (json['errors'].hasOwnProperty(key)) {
                        errors[name] = json['errors'][key];
                    }
                }, this);
                return errors;
            }
        });
    });
    require.define('/lib/serializer/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/serializer/serializer.js', module);
        require('/lib/serializer/json_serializer.js', module);
    });
    require.define('/lib/serializer/json_serializer.js', function (module, exports, __dirname, __filename) {
        require('/lib/serializer/serializer.js', module);
        require('/lib/transforms/json_transforms.js', module);
        var get = Ember.get, set = Ember.set;
        Ep.JsonSerializer = Ep.Serializer.extend({
            init: function () {
                this._super.apply(this, arguments);
                if (!get(this, 'transforms')) {
                    this.set('transforms', Ep.JsonTransforms);
                }
                this.sideloadMapping = Ember.Map.create();
                this.metadataMapping = Ember.Map.create();
                this.configure({
                    meta: 'meta',
                    since: 'since'
                });
            },
            configure: function (type, configuration) {
                var key;
                if (type && !configuration) {
                    for (key in type) {
                        this.metadataMapping.set(get(type, key), key);
                    }
                    return this._super(type);
                }
                var sideloadAs = configuration.sideloadAs, sideloadMapping;
                if (sideloadAs) {
                    sideloadMapping = this.aliases.sideloadMapping || Ember.Map.create();
                    sideloadMapping.set(sideloadAs, type);
                    this.aliases.sideloadMapping = sideloadMapping;
                    delete configuration.sideloadAs;
                }
                this._super.apply(this, arguments);
            },
            addId: function (data, key, id) {
                data[key] = id;
            },
            addAttribute: function (hash, key, value) {
                hash[key] = value;
            },
            extractAttribute: function (type, hash, attributeName) {
                var key = this._keyForAttributeName(type, attributeName);
                return hash[key];
            },
            extractId: function (type, hash) {
                var primaryKey = this._primaryKey(type);
                if (hash.hasOwnProperty(primaryKey)) {
                    return hash[primaryKey] + '';
                } else {
                    return null;
                }
            },
            extractClientId: function (type, hash) {
                var clientKey = this._clientKey(type);
                if (hash.hasOwnProperty(clientKey) && hash[clientKey] !== null) {
                    return hash[clientKey] + '';
                } else {
                    return null;
                }
            },
            extractRevision: function (type, hash) {
                var revision = this._revision(type);
                if (hash.hasOwnProperty(revision) && hash[revision] !== null) {
                    return parseInt(hash[revision]);
                } else {
                    return undefined;
                }
            },
            extractClientRevision: function (type, hash) {
                var revision = this._clientRevision(type);
                if (hash.hasOwnProperty(revision) && hash[revision] !== null) {
                    return parseInt(hash[revision]);
                } else {
                    return undefined;
                }
            },
            extractHasMany: function (type, hash, key) {
                return hash[key];
            },
            extractBelongsTo: function (type, hash, key) {
                return hash[key];
            },
            extractBelongsToPolymorphic: function (type, hash, key) {
                var keyForId = this.keyForPolymorphicId(key), keyForType, id = hash[keyForId];
                if (id) {
                    keyForType = this.keyForPolymorphicType(key);
                    return {
                        id: id,
                        type: hash[keyForType]
                    };
                }
                return null;
            },
            addBelongsTo: function (hash, record, key, relationship) {
                var type = record.constructor, name = relationship.key, value = null, includeType = relationship.options && relationship.options.polymorphic, embeddedChild, child, id;
                if (this.embeddedType(type, name)) {
                    if (embeddedChild = get(record, name)) {
                        value = this.serialize(embeddedChild, {
                            includeId: true,
                            includeType: includeType
                        });
                    }
                    hash[key] = value;
                } else {
                    child = get(record, relationship.key);
                    id = get(child, 'id');
                    if (relationship.options && relationship.options.polymorphic && !Ember.isNone(id)) {
                        type = get(child, 'type');
                        this.addBelongsToPolymorphic(hash, key, id, type);
                    } else {
                        hash[key] = id === undefined ? null : this.serializeId(id);
                    }
                }
            },
            addBelongsToPolymorphic: function (hash, key, id, type) {
                var keyForId = this.keyForPolymorphicId(key), keyForType = this.keyForPolymorphicType(key);
                hash[keyForId] = id;
                hash[keyForType] = this.rootForType(type);
            },
            addHasMany: function (hash, record, key, relationship) {
                var type = record.constructor, name = relationship.key, serializedHasMany = [], includeType = relationship.options && relationship.options.polymorphic, manyArray, embeddedType;
                embeddedType = this.embeddedType(type, name);
                if (embeddedType !== 'always') {
                    return;
                }
                manyArray = get(record, name);
                manyArray.forEach(function (record) {
                    serializedHasMany.push(this.serialize(record, {
                        includeId: true,
                        includeType: includeType
                    }));
                }, this);
                hash[key] = serializedHasMany;
            },
            addType: function (hash, type) {
                var keyForType = this.keyForEmbeddedType();
                hash[keyForType] = this.rootForType(type);
            },
            deserialize: function (data) {
                var result = [];
                for (var prop in data) {
                    if (!data.hasOwnProperty(prop) || !!this.metadataMapping.get(prop)) {
                        continue;
                    }
                    var type = this.typeFromAlias(prop);
                    Ember.assert('Your server returned a hash with the key ' + prop + ' but you have no mapping for it', !!type);
                    var value = data[prop];
                    if (value instanceof Array) {
                        for (var i = 0; i < value.length; i++) {
                            result.push(this.deserializeModel(type, value[i]));
                        }
                    } else {
                        result.push(this.deserializeModel(type, value));
                    }
                }
                return result;
            },
            extractMeta: function (type, json) {
                var meta = this.configOption(type, 'meta'), data = json, value;
                if (meta && json[meta]) {
                    data = json[meta];
                }
                var result = {};
                this.metadataMapping.forEach(function (property, key) {
                    if (value = data[property]) {
                        result[key] = value;
                    }
                });
                return result;
            },
            extractEmbeddedType: function (relationship, data) {
                var foundType = relationship.type;
                if (relationship.options && relationship.options.polymorphic) {
                    var key = this.keyFor(relationship), keyForEmbeddedType = this.keyForEmbeddedType(key);
                    foundType = this.typeFromAlias(data[keyForEmbeddedType]);
                    delete data[keyForEmbeddedType];
                }
                return foundType;
            },
            configureSideloadMappingForType: function (type, configured) {
                if (!configured) {
                    configured = Ember.A([]);
                }
                configured.pushObject(type);
                type.eachRelatedType(function (relatedType) {
                    if (!configured.contains(relatedType)) {
                        var root = this.defaultSideloadRootForType(relatedType);
                        this.aliases.set(root, relatedType);
                        this.configureSideloadMappingForType(relatedType, configured);
                    }
                }, this);
            },
            keyForPolymorphicId: Ember.K,
            keyForPolymorphicType: Ember.K,
            keyForEmbeddedType: function () {
                return 'type';
            },
            rootForType: function (type) {
                var typeString = type.toString();
                Ember.assert('Your model must not be anonymous. It was ' + type, typeString.charAt(0) !== '(');
                var parts = typeString.split('.');
                var name = parts[parts.length - 1];
                return name.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1);
            },
            defaultSideloadRootForType: function (type) {
                return this.pluralize(this.rootForType(type));
            }
        });
    });
    require.define('/lib/transforms/json_transforms.js', function (module, exports, __dirname, __filename) {
        var none = Ember.isNone, empty = Ember.isEmpty;
        require('/lib/ext/date.js', module);
        Ep.JsonTransforms = {
            string: {
                deserialize: function (serialized) {
                    return none(serialized) ? null : String(serialized);
                },
                serialize: function (deserialized) {
                    return none(deserialized) ? null : String(deserialized);
                }
            },
            number: {
                deserialize: function (serialized) {
                    return empty(serialized) ? null : Number(serialized);
                },
                serialize: function (deserialized) {
                    return empty(deserialized) ? null : Number(deserialized);
                }
            },
            'boolean': {
                deserialize: function (serialized) {
                    var type = typeof serialized;
                    if (type === 'boolean') {
                        return serialized;
                    } else if (type === 'string') {
                        return serialized.match(/^true$|^t$|^1$/i) !== null;
                    } else if (type === 'number') {
                        return serialized === 1;
                    } else {
                        return false;
                    }
                },
                serialize: function (deserialized) {
                    return Boolean(deserialized);
                }
            },
            date: {
                deserialize: function (serialized) {
                    var type = typeof serialized;
                    if (type === 'string') {
                        return new Date(Ember.Date.parse(serialized));
                    } else if (type === 'number') {
                        return new Date(serialized);
                    } else if (serialized === null || serialized === undefined) {
                        return serialized;
                    } else {
                        return null;
                    }
                },
                serialize: function (date) {
                    if (date instanceof Date) {
                        var days = [
                                'Sun',
                                'Mon',
                                'Tue',
                                'Wed',
                                'Thu',
                                'Fri',
                                'Sat'
                            ];
                        var months = [
                                'Jan',
                                'Feb',
                                'Mar',
                                'Apr',
                                'May',
                                'Jun',
                                'Jul',
                                'Aug',
                                'Sep',
                                'Oct',
                                'Nov',
                                'Dec'
                            ];
                        var pad = function (num) {
                            return num < 10 ? '0' + num : '' + num;
                        };
                        var utcYear = date.getUTCFullYear(), utcMonth = date.getUTCMonth(), utcDayOfMonth = date.getUTCDate(), utcDay = date.getUTCDay(), utcHours = date.getUTCHours(), utcMinutes = date.getUTCMinutes(), utcSeconds = date.getUTCSeconds();
                        var dayOfWeek = days[utcDay];
                        var dayOfMonth = pad(utcDayOfMonth);
                        var month = months[utcMonth];
                        return dayOfWeek + ', ' + dayOfMonth + ' ' + month + ' ' + utcYear + ' ' + pad(utcHours) + ':' + pad(utcMinutes) + ':' + pad(utcSeconds) + ' GMT';
                    } else {
                        return null;
                    }
                }
            }
        };
    });
    require.define('/lib/ext/date.js', function (module, exports, __dirname, __filename) {
        Ember.Date = Ember.Date || {};
        var origParse = Date.parse, numericKeys = [
                1,
                4,
                5,
                6,
                7,
                10,
                11
            ];
        Ember.Date.parse = function (date) {
            var timestamp, struct, minutesOffset = 0;
            if (struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date)) {
                for (var i = 0, k; k = numericKeys[i]; ++i) {
                    struct[k] = +struct[k] || 0;
                }
                struct[2] = (+struct[2] || 1) - 1;
                struct[3] = +struct[3] || 1;
                if (struct[8] !== 'Z' && struct[9] !== undefined) {
                    minutesOffset = struct[10] * 60 + struct[11];
                    if (struct[9] === '+') {
                        minutesOffset = 0 - minutesOffset;
                    }
                }
                timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
            } else {
                timestamp = origParse ? origParse(date) : NaN;
            }
            return timestamp;
        };
        if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.Date) {
            Date.parse = Ember.Date.parse;
        }
    });
    require.define('/lib/serializer/serializer.js', function (module, exports, __dirname, __filename) {
        require('/lib/model/index.js', module);
        var get = Ember.get, set = Ember.set, map = Ember.ArrayPolyfills.map, isNone = Ember.isNone;
        function mustImplement(name) {
            return function () {
                throw new Ember.Error('Your serializer ' + this.toString() + ' does not implement the required method ' + name);
            };
        }
        Ep.Serializer = Ember.Object.extend({
            init: function () {
                this.mappings = Ember.Map.create();
                this.aliases = Ember.Map.create();
                this.configurations = Ember.Map.create();
                this.globalConfigurations = {};
            },
            deserialize: mustImplement('deserialize'),
            extractId: mustImplement('extractId'),
            extractClientId: mustImplement('extractClientId'),
            extractRevision: mustImplement('extractRevision'),
            extractClientRevision: mustImplement('extractClientRevision'),
            extractAttribute: mustImplement('extractAttribute'),
            extractHasMany: mustImplement('extractHasMany'),
            extractBelongsTo: mustImplement('extractBelongsTo'),
            deserializeModel: function (type, hash) {
                var model = this.createModel(type);
                set(model, 'id', this.extractId(type, hash));
                set(model, 'clientId', this.extractClientId(type, hash));
                set(model, 'rev', this.extractRevision(type, hash));
                set(model, 'clientRev', this.extractClientRevision(type, hash));
                this.deserializeAttributes(model, hash);
                this.deserializeRelationships(model, hash);
                return model;
            },
            createModel: function (type) {
                return type.create();
            },
            deserializeValue: function (value, attributeType) {
                var transform = this.transforms ? this.transforms[attributeType] : null;
                Ember.assert('You tried to use a attribute type (' + attributeType + ') that has not been registered', transform);
                return transform.deserialize(value);
            },
            deserializeAttributes: function (model, data) {
                model.eachAttribute(function (name, attribute) {
                    set(model, name, this.deserializeAttribute(model, data, name, attribute.type));
                }, this);
            },
            deserializeAttribute: function (record, data, attributeName, attributeType) {
                var value = this.extractAttribute(record.constructor, data, attributeName);
                return this.deserializeValue(value, attributeType);
            },
            deserializeRelationships: function (model, hash) {
                model.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'hasMany') {
                        this.deserializeHasMany(name, model, hash, relationship);
                    } else if (relationship.kind === 'belongsTo') {
                        this.deserializeBelongsTo(name, model, hash, relationship);
                    }
                }, this);
            },
            deserializeHasMany: function (name, model, data, relationship) {
                var type = get(model, 'type'), key = this._keyForHasMany(type, relationship.key), embeddedType = this.embeddedType(type, name), value = this.extractHasMany(type, data, key);
                if (embeddedType) {
                    this.deserializeEmbeddedHasMany(name, model, value, relationship);
                } else {
                    this.deserializeLazyHasMany(name, model, value, relationship);
                }
            },
            deserializeEmbeddedHasMany: function (name, model, values, relationship) {
                get(model, name).addObjects(values.map(function (data) {
                    var type = this.extractEmbeddedType(relationship, data);
                    return this.deserializeModel(type, data);
                }, this));
            },
            deserializeLazyHasMany: function (name, model, values, relationship) {
                if (!values) {
                    return;
                }
                get(model, name).addObjects(values.map(function (value) {
                    return Ep.LazyModel.create({
                        id: value && value.toString(),
                        type: relationship.type
                    });
                }, this));
            },
            deserializeBelongsTo: function (name, model, hash, relationship) {
                var type = get(model, 'type'), key = this._keyForBelongsTo(type, relationship.key), embeddedType = this.embeddedType(type, name), value;
                if (embeddedType) {
                    if (relationship.options && relationship.options.polymorphic) {
                        value = this.extractBelongsToPolymorphic(type, hash, key);
                    } else {
                        value = this.extractBelongsTo(type, hash, key);
                    }
                    this.deserializeEmbeddedBelongsTo(name, model, value, relationship);
                } else {
                    value = this.extractBelongsTo(type, hash, key);
                    this.deserializeLazyBelongsTo(name, model, value, relationship);
                }
            },
            deserializeEmbeddedBelongsTo: function (name, model, value, relationship) {
                if (!value) {
                    return;
                }
                var type = this.extractEmbeddedType(relationship, value);
                var child = this.deserializeModel(type, value);
                set(model, name, child);
            },
            deserializeLazyBelongsTo: function (name, model, value, relationship) {
                if (!value) {
                    return;
                }
                set(model, name, Ep.LazyModel.create({
                    id: value && value.toString(),
                    type: relationship.type
                }));
            },
            extractEmbeddedType: function (relationship, data) {
                return relationship.type;
            },
            _convertPrematerializedHasMany: function (type, prematerializedHasMany) {
                var tuplesOrReferencesOrOpaque;
                if (typeof prematerializedHasMany === 'string') {
                    tuplesOrReferencesOrOpaque = prematerializedHasMany;
                } else {
                    tuplesOrReferencesOrOpaque = this._convertTuples(type, prematerializedHasMany);
                }
                return tuplesOrReferencesOrOpaque;
            },
            _convertTuples: function (type, idsOrTuples) {
                return map.call(idsOrTuples, function (idOrTuple) {
                    return this._convertTuple(type, idOrTuple);
                }, this);
            },
            _convertTuple: function (type, idOrTuple) {
                var foundType;
                if (typeof idOrTuple === 'object') {
                    if (Ep.Model.detect(idOrTuple.type)) {
                        return idOrTuple;
                    } else {
                        foundType = this.typeFromAlias(idOrTuple.type);
                        Ember.assert('Unable to resolve type ' + idOrTuple.type + '.  You may need to configure your serializer aliases.', !!foundType);
                        return {
                            id: idOrTuple.id,
                            type: foundType
                        };
                    }
                }
                return {
                    id: idOrTuple,
                    type: type
                };
            },
            serialize: function (record, options) {
                options = options || {};
                var serialized = this.createSerializedForm(), id, rev, clientRev;
                if (options.includeId) {
                    if (id = get(record, 'id')) {
                        this._addId(serialized, record.constructor, id);
                    }
                    this._addClientId(serialized, record.constructor, get(record, 'clientId'));
                    if (rev = get(record, 'rev')) {
                        this._addRevision(serialized, record.constructor, get(record, 'rev'));
                    }
                    if (clientRev = get(record, 'clientRev')) {
                        this._addClientRevision(serialized, record.constructor, get(record, 'clientRev'));
                    }
                }
                if (options.includeType) {
                    this.addType(serialized, record.constructor);
                }
                this.addAttributes(serialized, record);
                this.addRelationships(serialized, record);
                return serialized;
            },
            serializeValue: function (value, attributeType) {
                var transform = this.transforms ? this.transforms[attributeType] : null;
                Ember.assert('You tried to use an attribute type (' + attributeType + ') that has not been registered', transform);
                return transform.serialize(value);
            },
            serializeId: function (id) {
                if (isNaN(id)) {
                    return id;
                }
                return +id;
            },
            serializeClientId: function (clientId) {
                return clientId;
            },
            serializeRevision: function (rev) {
                return rev;
            },
            serializeClientRevision: function (rev) {
                return rev;
            },
            addAttributes: function (data, record) {
                record.eachAttribute(function (name, attribute) {
                    this._addAttribute(data, record, name, attribute.type);
                }, this);
            },
            addAttribute: mustImplement('addAttribute'),
            addId: mustImplement('addId'),
            addType: Ember.K,
            createSerializedForm: function () {
                return {};
            },
            addRelationships: function (data, record) {
                record.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        this._addBelongsTo(data, record, name, relationship);
                    } else if (relationship.kind === 'hasMany') {
                        this._addHasMany(data, record, name, relationship);
                    }
                }, this);
            },
            addBelongsTo: mustImplement('addBelongsTo'),
            addHasMany: mustImplement('addHasMany'),
            keyForAttributeName: function (type, name) {
                return name;
            },
            primaryKey: function (type) {
                return 'id';
            },
            clientKey: function (type) {
                return 'client_id';
            },
            revision: function (type) {
                return 'rev';
            },
            clientRevision: function (type) {
                return 'client_rev';
            },
            keyForBelongsTo: function (type, name) {
                return this.keyForAttributeName(type, name);
            },
            keyForHasMany: function (type, name) {
                return this.keyForAttributeName(type, name);
            },
            _primaryKey: function (type) {
                var config = this.configurationForType(type), primaryKey = config && config.primaryKey;
                if (primaryKey) {
                    return primaryKey;
                } else {
                    return this.primaryKey(type);
                }
            },
            _clientKey: function (type) {
                var config = this.configurationForType(type), clientKey = config && config.clientKey;
                if (clientKey) {
                    return clientKey;
                } else {
                    return this.clientKey(type);
                }
            },
            _revision: function (type) {
                var config = this.configurationForType(type), revision = config && config.revision;
                if (revision) {
                    return revision;
                } else {
                    return this.revision(type);
                }
            },
            _clientRevision: function (type) {
                var config = this.configurationForType(type), clientRevision = config && config.clientRevision;
                if (clientRevision) {
                    return clientRevision;
                } else {
                    return this.clientRevision(type);
                }
            },
            _addAttribute: function (data, record, attributeName, attributeType) {
                var key = this._keyForAttributeName(record.constructor, attributeName);
                var value = get(record, attributeName);
                this.addAttribute(data, key, this.serializeValue(value, attributeType));
            },
            _addId: function (hash, type, id) {
                var primaryKey = this._primaryKey(type);
                this.addId(hash, primaryKey, this.serializeId(id));
            },
            _addClientId: function (hash, type, id) {
                var clientKey = this._clientKey(type);
                this.addId(hash, clientKey, this.serializeClientId(id));
            },
            _addRevision: function (hash, type, rev) {
                var revision = this._revision(type);
                this.addId(hash, revision, this.serializeRevision(rev));
            },
            _addClientRevision: function (hash, type, rev) {
                var revision = this._clientRevision(type);
                this.addId(hash, revision, this.serializeClientRevision(rev));
            },
            _keyForAttributeName: function (type, name) {
                return this._keyFromMappingOrHook('keyForAttributeName', type, name);
            },
            _keyForBelongsTo: function (type, name) {
                return this._keyFromMappingOrHook('keyForBelongsTo', type, name);
            },
            keyFor: function (description) {
                var type = description.parentType, name = description.key;
                switch (description.kind) {
                case 'belongsTo':
                    return this._keyForBelongsTo(type, name);
                case 'hasMany':
                    return this._keyForHasMany(type, name);
                }
            },
            _keyForHasMany: function (type, name) {
                return this._keyFromMappingOrHook('keyForHasMany', type, name);
            },
            _addBelongsTo: function (data, record, name, relationship) {
                var key = this._keyForBelongsTo(record.constructor, name);
                this.addBelongsTo(data, record, key, relationship);
            },
            _addHasMany: function (data, record, name, relationship) {
                var key = this._keyForHasMany(record.constructor, name);
                this.addHasMany(data, record, key, relationship);
            },
            _keyFromMappingOrHook: function (publicMethod, type, name) {
                var key = this.mappingOption(type, name, 'key');
                if (key) {
                    return key;
                } else {
                    return this[publicMethod](type, name);
                }
            },
            registerTransform: function (type, transform) {
                this.transforms[type] = transform;
            },
            registerEnumTransform: function (type, objects) {
                var transform = {
                        deserialize: function (serialized) {
                            return Ember.A(objects).objectAt(serialized);
                        },
                        serialize: function (deserialized) {
                            return Ember.EnumerableUtils.indexOf(objects, deserialized);
                        },
                        values: objects
                    };
                this.registerTransform(type, transform);
            },
            map: function (type, mappings) {
                this.mappings.set(type, mappings);
            },
            configure: function (type, configuration) {
                if (type && !configuration) {
                    Ember.merge(this.globalConfigurations, type);
                    return;
                }
                var config, alias;
                if (configuration.alias) {
                    alias = configuration.alias;
                    this.aliases.set(alias, type);
                    delete configuration.alias;
                }
                config = Ember.create(this.globalConfigurations);
                Ember.merge(config, configuration);
                this.configurations.set(type, config);
            },
            typeFromAlias: function (alias) {
                this._completeAliases();
                var singular = this.singularize(alias);
                return this.container.lookup('model:' + singular);
            },
            mappingForType: function (type) {
                this._reifyMappings();
                return this.mappings.get(type) || {};
            },
            configurationForType: function (type) {
                this._reifyConfigurations();
                return this.configurations.get(type) || this.globalConfigurations;
            },
            _completeAliases: function () {
                this._pluralizeAliases();
                this._reifyAliases();
            },
            _pluralizeAliases: function () {
                if (this._didPluralizeAliases) {
                    return;
                }
                var aliases = this.aliases, sideloadMapping = this.aliases.sideloadMapping, plural, self = this;
                aliases.forEach(function (key, type) {
                    plural = self.pluralize(key);
                    Ember.assert('The \'' + key + '\' alias has already been defined', !aliases.get(plural));
                    aliases.set(plural, type);
                });
                if (sideloadMapping) {
                    sideloadMapping.forEach(function (key, type) {
                        Ember.assert('The \'' + key + '\' alias has already been defined', !aliases.get(key) || aliases.get(key) === type);
                        aliases.set(key, type);
                    });
                    delete this.aliases.sideloadMapping;
                }
                this._didPluralizeAliases = true;
            },
            _reifyAliases: function () {
                if (this._didReifyAliases) {
                    return;
                }
                var aliases = this.aliases, reifiedAliases = Ember.Map.create(), foundType;
                aliases.forEach(function (key, type) {
                    if (typeof type === 'string') {
                        foundType = Ember.get(Ember.lookup, type);
                        Ember.assert('Could not find model at path ' + key, type);
                        reifiedAliases.set(key, foundType);
                    } else {
                        reifiedAliases.set(key, type);
                    }
                });
                this.aliases = reifiedAliases;
                this._didReifyAliases = true;
            },
            _reifyMappings: function () {
                if (this._didReifyMappings) {
                    return;
                }
                var mappings = this.mappings, reifiedMappings = Ember.Map.create();
                mappings.forEach(function (key, mapping) {
                    if (typeof key === 'string') {
                        var type = Ember.get(Ember.lookup, key);
                        Ember.assert('Could not find model at path ' + key, type);
                        reifiedMappings.set(type, mapping);
                    } else {
                        reifiedMappings.set(key, mapping);
                    }
                });
                this.mappings = reifiedMappings;
                this._didReifyMappings = true;
            },
            _reifyConfigurations: function () {
                if (this._didReifyConfigurations) {
                    return;
                }
                var configurations = this.configurations, reifiedConfigurations = Ember.Map.create();
                configurations.forEach(function (key, mapping) {
                    if (typeof key === 'string' && key !== 'plurals') {
                        var type = Ember.get(Ember.lookup, key);
                        Ember.assert('Could not find model at path ' + key, type);
                        reifiedConfigurations.set(type, mapping);
                    } else {
                        reifiedConfigurations.set(key, mapping);
                    }
                });
                this.configurations = reifiedConfigurations;
                this._didReifyConfigurations = true;
            },
            mappingOption: function (type, name, option) {
                var mapping = this.mappingForType(type)[name];
                return mapping && mapping[option];
            },
            configOption: function (type, option) {
                var config = this.configurationForType(type);
                return config[option];
            },
            embeddedType: function (type, name) {
                return this.mappingOption(type, name, 'embedded');
            },
            eachEmbeddedRecord: function (record, callback, binding) {
                this.eachEmbeddedBelongsToRecord(record, callback, binding);
                this.eachEmbeddedHasManyRecord(record, callback, binding);
            },
            eachEmbeddedBelongsToRecord: function (record, callback, binding) {
                this.eachEmbeddedBelongsTo(record.constructor, function (name, relationship, embeddedType) {
                    var embeddedRecord = get(record, name);
                    if (embeddedRecord) {
                        callback.call(binding, embeddedRecord, embeddedType);
                    }
                });
            },
            eachEmbeddedHasManyRecord: function (record, callback, binding) {
                this.eachEmbeddedHasMany(record.constructor, function (name, relationship, embeddedType) {
                    var array = get(record, name);
                    for (var i = 0, l = get(array, 'length'); i < l; i++) {
                        callback.call(binding, array.objectAt(i), embeddedType);
                    }
                });
            },
            eachEmbeddedHasMany: function (type, callback, binding) {
                this.eachEmbeddedRelationship(type, 'hasMany', callback, binding);
            },
            eachEmbeddedBelongsTo: function (type, callback, binding) {
                this.eachEmbeddedRelationship(type, 'belongsTo', callback, binding);
            },
            eachEmbeddedRelationship: function (type, kind, callback, binding) {
                type.eachRelationship(function (name, relationship) {
                    var embeddedType = this.embeddedType(type, name);
                    if (embeddedType) {
                        if (relationship.kind === kind) {
                            callback.call(binding, name, relationship, embeddedType);
                        }
                    }
                }, this);
            },
            pluralize: function (name) {
                var plurals = this.configurations.get('plurals');
                return plurals && plurals[name] || name + 's';
            },
            singularize: function (name) {
                var plurals = this.configurations.get('plurals');
                if (plurals) {
                    for (var i in plurals) {
                        if (plurals[i] === name) {
                            return i;
                        }
                    }
                }
                if (name.lastIndexOf('s') === name.length - 1) {
                    return name.substring(0, name.length - 1);
                } else {
                    return name;
                }
            }
        });
    });
    require.define('/lib/model/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/model/model.js', module);
        require('/lib/model/proxies.js', module);
        require('/lib/model/attribute.js', module);
        require('/lib/model/relationships/belongs_to.js', module);
        require('/lib/model/relationships/has_many.js', module);
        require('/lib/model/relationships/ext.js', module);
        require('/lib/model/errors.js', module);
    });
    require.define('/lib/model/errors.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.Errors = Ember.ObjectProxy.extend(Ember.Copyable, {
            init: function () {
                this._super.apply(this, arguments);
                if (!get(this, 'content'))
                    set(this, 'content', {});
            },
            forEach: function (callback, self) {
                var keys = Ember.keys(this.content);
                keys.forEach(function (key) {
                    var value = get(this.content, key);
                    callback.call(self, key, value);
                }, this);
            },
            copy: function () {
                return Ep.Errors.create({ content: Ember.copy(this.content) });
            }
        });
    });
    require.define('/lib/model/relationships/ext.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.Model.reopen({
            didDefineProperty: function (proto, key, value) {
                if (value instanceof Ember.Descriptor) {
                    var meta = value.meta();
                    if (meta.isRelationship && meta.kind === 'belongsTo') {
                        Ember.addObserver(proto, key, null, 'belongsToDidChange');
                        Ember.addBeforeObserver(proto, key, null, 'belongsToWillChange');
                    }
                    if (meta.isAttribute) {
                        Ember.addBeforeObserver(proto, key, null, 'attributeWillChange');
                    }
                    meta.parentType = proto.constructor;
                }
            },
            _suspendedRelationships: false,
            suspendRelationshipObservers: function (callback, binding) {
                var observers = get(this.constructor, 'relationshipNames').belongsTo;
                var self = this;
                if (this._suspendedRelationships) {
                    return callback.call(binding || self);
                }
                try {
                    this._suspendedRelationships = true;
                    Ember._suspendObservers(self, observers, null, 'belongsToDidChange', function () {
                        Ember._suspendBeforeObservers(self, observers, null, 'belongsToWillChange', function () {
                            callback.call(binding || self);
                        });
                    });
                } finally {
                    this._suspendedRelationships = false;
                }
            },
            _registerRelationships: function () {
                var session = get(this, 'session');
                Ember.assert('Must be attached to a session', !!session);
                this.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        var model = get(this, name);
                        if (model) {
                            session.belongsToManager.register(model, name, this);
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var children = get(this, name);
                        children.forEach(function (model) {
                            session.collectionManager.register(children, model);
                        }, this);
                    }
                }, this);
            }
        });
        Ep.Model.reopenClass({
            typeForRelationship: function (name) {
                var relationship = get(this, 'relationshipsByName').get(name);
                return relationship && relationship.type;
            },
            inverseFor: function (name) {
                var inverseType = this.typeForRelationship(name);
                if (!inverseType) {
                    return null;
                }
                var options = this.metaForProperty(name).options;
                var inverseName, inverseKind;
                if (options.inverse) {
                    inverseName = options.inverse;
                    inverseKind = Ember.get(inverseType, 'relationshipsByName').get(inverseName).kind;
                } else {
                    var possibleRelationships = findPossibleInverses(this, inverseType);
                    if (possibleRelationships.length === 0) {
                        return null;
                    }
                    Ember.assert('You defined the \'' + name + '\' relationship on ' + this + ', but multiple possible inverse relationships of type ' + this + ' were found on ' + inverseType + '.', possibleRelationships.length === 1);
                    inverseName = possibleRelationships[0].name;
                    inverseKind = possibleRelationships[0].kind;
                }
                function findPossibleInverses(type, inverseType, possibleRelationships) {
                    possibleRelationships = possibleRelationships || [];
                    var relationshipMap = get(inverseType, 'relationships');
                    if (!relationshipMap) {
                        return;
                    }
                    var relationships = relationshipMap.get(type);
                    if (relationships) {
                        possibleRelationships.push.apply(possibleRelationships, relationshipMap.get(type));
                    }
                    if (type.superclass) {
                        findPossibleInverses(type.superclass, inverseType, possibleRelationships);
                    }
                    return possibleRelationships;
                }
                return {
                    type: inverseType,
                    name: inverseName,
                    kind: inverseKind
                };
            },
            relationships: Ember.computed(function () {
                var map = new Ember.MapWithDefault({
                        defaultValue: function () {
                            return [];
                        }
                    });
                this.eachComputedProperty(function (name, meta) {
                    if (meta.isRelationship) {
                        if (typeof meta.type === 'string') {
                            meta.type = Ep.__container__.lookup('model:' + meta.type);
                        }
                        var relationshipsForType = map.get(meta.type);
                        relationshipsForType.push({
                            name: name,
                            kind: meta.kind
                        });
                    }
                });
                return map;
            }),
            relationshipNames: Ember.computed(function () {
                var names = {
                        hasMany: [],
                        belongsTo: []
                    };
                this.eachComputedProperty(function (name, meta) {
                    if (meta.isRelationship) {
                        names[meta.kind].push(name);
                    }
                });
                return names;
            }),
            relatedTypes: Ember.computed(function () {
                var type, types = Ember.A([]);
                this.eachComputedProperty(function (name, meta) {
                    if (meta.isRelationship) {
                        type = meta.type;
                        if (typeof type === 'string') {
                            type = Ep.__container__.lookup('model:' + type);
                        }
                        Ember.assert('You specified a hasMany (' + meta.type + ') on ' + meta.parentType + ' but ' + meta.type + ' was not found.', type);
                        if (!types.contains(type)) {
                            Ember.assert('Trying to sideload ' + name + ' on ' + this.toString() + ' but the type doesn\'t exist.', !!type);
                            types.push(type);
                        }
                    }
                });
                return types;
            }),
            relationshipsByName: Ember.computed(function () {
                var map = Ember.Map.create(), type;
                this.eachComputedProperty(function (name, meta) {
                    if (meta.isRelationship) {
                        meta.key = name;
                        type = meta.type;
                        if (typeof type === 'string') {
                            meta.type = Ep.__container__.lookup('model:' + type);
                        }
                        map.set(name, meta);
                    }
                });
                return map;
            }),
            fields: Ember.computed(function () {
                var map = Ember.Map.create();
                this.eachComputedProperty(function (name, meta) {
                    if (meta.isRelationship) {
                        map.set(name, meta.kind);
                    } else if (meta.isAttribute) {
                        map.set(name, 'attribute');
                    }
                });
                return map;
            }),
            eachRelationship: function (callback, binding) {
                get(this, 'relationshipsByName').forEach(function (name, relationship) {
                    callback.call(binding, name, relationship);
                });
            },
            eachRelatedType: function (callback, binding) {
                get(this, 'relatedTypes').forEach(function (type) {
                    callback.call(binding, type);
                });
            }
        });
        Ep.Model.reopen({
            eachRelationship: function (callback, binding) {
                this.constructor.eachRelationship(callback, binding);
            },
            eachRelatedModel: function (callback, binding, cache) {
                if (!cache)
                    cache = Ember.Set.create();
                if (cache.contains(this))
                    return;
                cache.add(this);
                callback.call(binding || this, this);
                if (!get(this, 'isLoaded'))
                    return;
                this.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        var child = get(this, name);
                        if (!child)
                            return;
                        this.eachRelatedModel.call(child, callback, binding, cache);
                    } else if (relationship.kind === 'hasMany') {
                        var children = get(this, name);
                        children.forEach(function (child) {
                            this.eachRelatedModel.call(child, callback, binding, cache);
                        }, this);
                    }
                }, this);
            }
        });
    });
    require.define('/lib/model/relationships/has_many.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set, forEach = Ember.ArrayPolyfills.forEach;
        require('/lib/model/model.js', module);
        require('/lib/collections/model_array.js', module);
        Ep.hasMany = function (type, options) {
            Ember.assert('The type passed to Ep.hasMany must be defined', !!type);
            options = options || {};
            var meta = {
                    type: type,
                    isRelationship: true,
                    options: options,
                    kind: 'hasMany'
                };
            return Ember.computed(function (key, value, cached) {
                var content;
                if (arguments.length === 1) {
                    content = [];
                } else {
                    content = value;
                }
                var session = get(this, 'session');
                if (session) {
                    content = content.map(function (model) {
                        return session.add(model);
                    }, this);
                }
                if (cached) {
                    set(cached, 'content', content);
                    return cached;
                }
                return Ep.HasManyArray.create({
                    owner: this,
                    name: key,
                    session: session,
                    content: content
                });
            }).property().meta(meta);
        };
        Ep.HasManyArray = Ep.ModelArray.extend({
            name: null,
            owner: null,
            replaceContent: function (idx, amt, objects) {
                var session = get(this, 'session');
                if (session) {
                    objects = objects.map(function (model) {
                        return session.add(model);
                    });
                }
                this._super(idx, amt, objects);
            },
            arrayContentWillChange: function (index, removed, added) {
                var owner = get(this, 'owner'), name = get(this, 'name'), session = get(owner, 'session');
                if (session) {
                    session.modelWillBecomeDirty(owner);
                }
                if (!owner._suspendedRelationships) {
                    var inverse = owner.constructor.inverseFor(name);
                    if (inverse) {
                        for (var i = index; i < index + removed; i++) {
                            var model = this.objectAt(i);
                            if (!get(model, 'isLoaded'))
                                continue;
                            model.suspendRelationshipObservers(function () {
                                if (inverse.kind === 'hasMany') {
                                    get(model, inverse.name).removeObject(owner);
                                } else if (inverse.kind === 'belongsTo') {
                                    set(model, inverse.name, null);
                                    if (session) {
                                        session.modelWillBecomeDirty(model);
                                        session.belongsToManager.unregister(model, inverse.name, owner);
                                    }
                                }
                            });
                        }
                    }
                }
                return this._super.apply(this, arguments);
            },
            arrayContentDidChange: function (index, removed, added) {
                this._super.apply(this, arguments);
                var owner = get(this, 'owner'), name = get(this, 'name');
                if (!owner._suspendedRelationships) {
                    var inverse = owner.constructor.inverseFor(name);
                    if (inverse) {
                        for (var i = index; i < index + added; i++) {
                            var model = this.objectAt(i);
                            if (!get(model, 'isLoaded'))
                                continue;
                            model.suspendRelationshipObservers(function () {
                                if (inverse.kind === 'hasMany') {
                                    get(model, inverse.name).addObject(owner);
                                } else if (inverse.kind === 'belongsTo') {
                                    set(model, inverse.name, owner);
                                    var session = get(owner, 'session');
                                    if (session) {
                                        session.belongsToManager.register(model, inverse.name, owner);
                                    }
                                }
                            });
                        }
                    }
                }
            }
        });
    });
    require.define('/lib/collections/model_array.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.ModelArray = Ember.ArrayProxy.extend({
            session: null,
            meta: null,
            arrayContentWillChange: function (index, removed, added) {
                for (var i = index; i < index + removed; i++) {
                    var model = this.objectAt(i);
                    if (this.session) {
                        this.session.collectionManager.unregister(this, model);
                    }
                }
                this._super.apply(this, arguments);
            },
            arrayContentDidChange: function (index, removed, added) {
                this._super.apply(this, arguments);
                for (var i = index; i < index + added; i++) {
                    var model = this.objectAt(i);
                    if (this.session) {
                        this.session.collectionManager.register(this, model);
                    }
                }
            },
            removeObject: function (obj) {
                var loc = get(this, 'length') || 0;
                while (--loc >= 0) {
                    var curObject = this.objectAt(loc);
                    if (curObject.isEqual(obj))
                        this.removeAt(loc);
                }
                return this;
            },
            contains: function (obj) {
                for (var i = 0; i < get(this, 'length'); i++) {
                    var m = this.objectAt(i);
                    if (obj.isEqual(m))
                        return true;
                }
                return false;
            },
            copyTo: function (dest) {
                var existing = Ep.ModelSet.create();
                existing.addObjects(dest);
                this.forEach(function (model) {
                    if (existing.contains(model)) {
                        existing.remove(model);
                    } else {
                        dest.addObject(model);
                    }
                });
                dest.removeObjects(existing);
            },
            diff: function (arr) {
                var diff = Ember.A();
                this.forEach(function (model) {
                    if (!arr.contains(model)) {
                        diff.push(model);
                    }
                }, this);
                arr.forEach(function (model) {
                    if (!this.contains(model)) {
                        diff.push(model);
                    }
                }, this);
                return diff;
            },
            isEqual: function (arr) {
                return this.diff(arr).length === 0;
            }
        });
    });
    require.define('/lib/model/model.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        require('/lib/collections/model_set.js', module);
        Ep.ModelMixin = Ember.Mixin.create({
            id: null,
            clientId: null,
            rev: null,
            clientRev: 0,
            session: null,
            errors: null,
            isEqual: function (model) {
                var clientId = get(this, 'clientId');
                var otherClientId = get(model, 'clientId');
                if (clientId && otherClientId) {
                    return clientId === otherClientId;
                }
                var id = get(this, 'id');
                var otherId = get(model, 'id');
                return this.isSameType(model) && id === otherId;
            },
            isSameType: function (model) {
                return this.hasType(get(model, 'type'));
            },
            hasType: function (type) {
                return get(this, 'type').detect(type);
            },
            type: Ember.computed(function (key, value) {
                return value || this.constructor;
            }),
            toStringExtension: function () {
                return '[' + get(this, 'id') + ', ' + get(this, 'clientId') + ']';
            },
            lazyCopy: function () {
                return Ep.LazyModel.create({
                    id: get(this, 'id'),
                    clientId: get(this, 'clientId'),
                    type: get(this, 'type'),
                    isDeleted: get(this, 'isDeleted'),
                    errors: get(this, 'errors')
                });
            },
            hasErrors: Ember.computed(function () {
                return !!get(this, 'errors');
            }).volatile(),
            isDetached: Ember.computed(function () {
                return !get(this, 'session');
            }).volatile(),
            isManaged: Ember.computed(function () {
                return !!get(this, 'session');
            }).volatile()
        });
        Ep.Model = Ember.Object.extend(Ember.Copyable, Ep.ModelMixin, {
            isPromise: false,
            isProxy: false,
            isNew: true,
            isDeleted: false,
            isLoaded: true,
            isDirty: Ember.computed(function () {
                var session = get(this, 'session');
                if (!session)
                    return false;
                return get(session, 'dirtyModels').contains(this);
            }).volatile(),
            diff: function (model) {
                var diffs = [];
                this.eachAttribute(function (name, meta) {
                    var left = get(this, name);
                    var right = get(model, name);
                    if (left instanceof Date && right instanceof Date) {
                        left = left.getTime();
                        right = right.getTime();
                    }
                    if (left !== right) {
                        diffs.push({
                            type: 'attr',
                            name: name
                        });
                    }
                }, this);
                this.eachRelationship(function (name, relationship) {
                    var left = get(this, name);
                    var right = get(model, name);
                    if (relationship.kind === 'belongsTo') {
                        if (left && right) {
                            if (!left.isEqual(right)) {
                                diffs.push({
                                    type: 'belongsTo',
                                    name: name,
                                    relationship: relationship,
                                    oldValue: right
                                });
                            }
                        } else if (left || right) {
                            diffs.push({
                                type: 'belongsTo',
                                name: name,
                                relationship: relationship,
                                oldValue: right
                            });
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var dirty = false;
                        var cache = Ep.ModelSet.create();
                        left.forEach(function (model) {
                            cache.add(model);
                        });
                        right.forEach(function (model) {
                            if (dirty)
                                return;
                            if (!cache.contains(model)) {
                                dirty = true;
                            } else {
                                cache.remove(model);
                            }
                        });
                        if (dirty || get(cache, 'length') > 0) {
                            diffs.push({
                                type: 'hasMany',
                                name: name,
                                relationship: relationship
                            });
                        }
                    }
                }, this);
                return diffs;
            },
            copy: function () {
                var dest = this.constructor.create();
                dest.beginPropertyChanges();
                this.copyAttributes(dest);
                this.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        var child = get(this, name);
                        if (child) {
                            set(dest, name, child.lazyCopy());
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var children = get(this, name);
                        var destChildren = get(dest, name);
                        children.forEach(function (child) {
                            destChildren.addObject(child.lazyCopy());
                        });
                    }
                }, this);
                dest.endPropertyChanges();
                return dest;
            },
            copyAttributes: function (dest) {
                dest.beginPropertyChanges();
                set(dest, 'id', get(this, 'id'));
                set(dest, 'clientId', get(this, 'clientId'));
                set(dest, 'rev', get(this, 'rev'));
                set(dest, 'clientRev', get(this, 'clientRev'));
                set(dest, 'errors', Ember.copy(get(this, 'errors')));
                set(dest, 'isNew', get(this, 'isNew'));
                set(dest, 'isDeleted', get(this, 'isDeleted'));
                this.eachAttribute(function (name, meta) {
                    var left = get(this, name);
                    var right = get(dest, name);
                    set(dest, name, left);
                }, this);
                dest.endPropertyChanges();
            }
        });
        Ep.Model.reopenClass({
            find: function (id) {
                if (!Ep.__container__) {
                    throw new Ember.Error('The Ep.__container__ property must be set in order to use static find methods.');
                }
                var container = Ep.__container__;
                var session = container.lookup('session:main');
                return session.find(this, id);
            }
        });
    });
    require.define('/lib/collections/model_set.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set, isNone = Ember.isNone, fmt = Ember.String.fmt;
        function guidFor(model) {
            return get(model, 'clientId');
        }
        Ep.ModelSet = Ember.CoreObject.extend(Ember.MutableEnumerable, Ember.Copyable, Ember.Freezable, {
            length: 0,
            clear: function () {
                if (this.isFrozen) {
                    throw new Error(Ember.FROZEN_ERROR);
                }
                var len = get(this, 'length');
                if (len === 0) {
                    return this;
                }
                var guid;
                this.enumerableContentWillChange(len, 0);
                Ember.propertyWillChange(this, 'firstObject');
                Ember.propertyWillChange(this, 'lastObject');
                for (var i = 0; i < len; i++) {
                    guid = guidFor(this[i]);
                    delete this[guid];
                    delete this[i];
                }
                set(this, 'length', 0);
                Ember.propertyDidChange(this, 'firstObject');
                Ember.propertyDidChange(this, 'lastObject');
                this.enumerableContentDidChange(len, 0);
                return this;
            },
            isEqual: function (obj) {
                if (!Ember.Enumerable.detect(obj))
                    return false;
                var loc = get(this, 'length');
                if (get(obj, 'length') !== loc)
                    return false;
                while (--loc >= 0) {
                    if (!obj.contains(this[loc]))
                        return false;
                }
                return true;
            },
            add: Ember.aliasMethod('addObject'),
            remove: Ember.aliasMethod('removeObject'),
            pop: function () {
                if (get(this, 'isFrozen'))
                    throw new Error(Ember.FROZEN_ERROR);
                var obj = this.length > 0 ? this[this.length - 1] : null;
                this.remove(obj);
                return obj;
            },
            push: Ember.aliasMethod('addObject'),
            shift: Ember.aliasMethod('pop'),
            unshift: Ember.aliasMethod('push'),
            addEach: Ember.aliasMethod('addObjects'),
            removeEach: Ember.aliasMethod('removeObjects'),
            init: function (items) {
                this._super();
                if (items)
                    this.addObjects(items);
            },
            nextObject: function (idx) {
                return this[idx];
            },
            firstObject: Ember.computed(function () {
                return this.length > 0 ? this[0] : undefined;
            }),
            lastObject: Ember.computed(function () {
                return this.length > 0 ? this[this.length - 1] : undefined;
            }),
            addObject: function (obj) {
                if (get(this, 'isFrozen'))
                    throw new Error(Ember.FROZEN_ERROR);
                if (isNone(obj))
                    return this;
                var guid = guidFor(obj), idx = this[guid], len = get(this, 'length'), added;
                if (idx >= 0 && idx < len && (this[idx] && this[idx].isEqual(obj))) {
                    if (this[idx] !== obj) {
                        this[idx] = obj;
                    }
                    return this;
                }
                added = [obj];
                this.enumerableContentWillChange(null, added);
                Ember.propertyWillChange(this, 'lastObject');
                len = get(this, 'length');
                this[guid] = len;
                this[len] = obj;
                set(this, 'length', len + 1);
                Ember.propertyDidChange(this, 'lastObject');
                this.enumerableContentDidChange(null, added);
                return this;
            },
            removeObject: function (obj) {
                if (get(this, 'isFrozen'))
                    throw new Error(Ember.FROZEN_ERROR);
                if (isNone(obj))
                    return this;
                var guid = guidFor(obj), idx = this[guid], len = get(this, 'length'), isFirst = idx === 0, isLast = idx === len - 1, last, removed;
                if (idx >= 0 && idx < len && (this[idx] && this[idx].isEqual(obj))) {
                    removed = [obj];
                    this.enumerableContentWillChange(removed, null);
                    if (isFirst) {
                        Ember.propertyWillChange(this, 'firstObject');
                    }
                    if (isLast) {
                        Ember.propertyWillChange(this, 'lastObject');
                    }
                    if (idx < len - 1) {
                        last = this[len - 1];
                        this[idx] = last;
                        this[guidFor(last)] = idx;
                    }
                    delete this[guid];
                    delete this[len - 1];
                    set(this, 'length', len - 1);
                    if (isFirst) {
                        Ember.propertyDidChange(this, 'firstObject');
                    }
                    if (isLast) {
                        Ember.propertyDidChange(this, 'lastObject');
                    }
                    this.enumerableContentDidChange(removed, null);
                }
                return this;
            },
            contains: function (obj) {
                return this[guidFor(obj)] >= 0;
            },
            copy: function (deep) {
                var C = this.constructor, ret = new C(), loc = get(this, 'length');
                set(ret, 'length', loc);
                while (--loc >= 0) {
                    ret[loc] = deep ? this[loc].copy() : this[loc];
                    ret[guidFor(this[loc])] = loc;
                }
                return ret;
            },
            toString: function () {
                var len = this.length, idx, array = [];
                for (idx = 0; idx < len; idx++) {
                    array[idx] = this[idx];
                }
                return fmt('Ep.ModelSet<%@>', [array.join(',')]);
            },
            getModel: function (model) {
                var idx = this[guidFor(model)];
                if (idx === undefined)
                    return;
                return this[idx];
            },
            getForClientId: function (clientId) {
                var idx = this[clientId];
                if (idx === undefined)
                    return;
                return this[idx];
            }
        });
        Ep.ModelSet.reopenClass({
            fromArray: function (models) {
                var res = this.create();
                res.addObjects(models);
                return res;
            }
        });
    });
    require.define('/lib/model/relationships/belongs_to.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set, isNone = Ember.isNone;
        Ep.belongsTo = function (type, options) {
            Ember.assert('The type passed to Ep.belongsTo must be defined', !!type);
            options = options || {};
            var meta = {
                    type: type,
                    isRelationship: true,
                    options: options,
                    kind: 'belongsTo'
                };
            return Ember.computed(function (key, value) {
                if (arguments.length === 1) {
                    return null;
                } else {
                    var session = get(this, 'session');
                    if (value && session) {
                        value = session.add(value);
                    }
                    return value;
                }
            }).property().meta(meta);
        };
        Ep.Model.reopen({
            belongsToWillChange: Ember.beforeObserver(function (model, key) {
                var oldParent = get(model, key);
                var session = get(model, 'session');
                if (session) {
                    session.modelWillBecomeDirty(model);
                }
                if (oldParent && session) {
                    session.belongsToManager.unregister(model, key, oldParent);
                }
                if (oldParent && get(oldParent, 'isLoaded')) {
                    var inverse = get(model, 'type').inverseFor(key);
                    if (inverse) {
                        oldParent.suspendRelationshipObservers(function () {
                            if (inverse.kind === 'hasMany' && model) {
                                get(oldParent, inverse.name).removeObject(model);
                            } else if (inverse.kind === 'belongsTo') {
                                set(oldParent, inverse.name, null);
                                if (session) {
                                    session.modelWillBecomeDirty(oldParent);
                                    session.belongsToManager.unregister(oldParent, inverse.name, model);
                                }
                            }
                        });
                    }
                }
            }),
            belongsToDidChange: Ember.immediateObserver(function (model, key) {
                var parent = get(model, key);
                var session = get(model, 'session');
                if (parent && session) {
                    session.belongsToManager.register(model, key, parent);
                }
                if (parent && get(parent, 'isLoaded')) {
                    var inverse = get(model, 'type').inverseFor(key);
                    if (inverse) {
                        parent.suspendRelationshipObservers(function () {
                            if (inverse.kind === 'hasMany' && model) {
                                get(parent, inverse.name).addObject(model);
                            } else if (inverse.kind === 'belongsTo') {
                                set(parent, inverse.name, model);
                                if (session)
                                    session.belongsToManager.register(parent, inverse.name, model);
                            }
                        });
                    }
                }
            })
        });
    });
    require.define('/lib/model/attribute.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.Model.reopenClass({
            attributes: Ember.computed(function () {
                var map = Ember.Map.create();
                this.eachComputedProperty(function (name, meta) {
                    if (meta.isAttribute) {
                        Ember.assert('You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: Ep.attr(\'<type>\')` from ' + this.toString(), name !== 'id');
                        meta.name = name;
                        map.set(name, meta);
                    }
                });
                return map;
            })
        });
        Ep.Model.reopen({
            eachAttribute: function (callback, binding) {
                get(this.constructor, 'attributes').forEach(function (name, meta) {
                    callback.call(binding, name, meta);
                }, binding);
            },
            attributeWillChange: Ember.beforeObserver(function (record, key) {
                var session = get(this, 'session');
                if (!session)
                    return;
                session.modelWillBecomeDirty(this);
            })
        });
        Ep.attr = function (type, options) {
            options = options || {};
            var meta = {
                    type: type,
                    isAttribute: true,
                    options: options
                };
            return Ember.computed(function (key, value, oldValue) {
                if (arguments.length > 1) {
                    Ember.assert('You may not set `id` as an attribute on your model. Please remove any lines that look like: `id: Ep.attr(\'<type>\')` from ' + this.constructor.toString(), key !== 'id');
                }
                return value;
            }).meta(meta);
        };
    });
    require.define('/lib/model/proxies.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        function triggerLoad(async) {
            return function () {
                if (!get(this, 'content') && !get(this, 'isLoading')) {
                    if (async) {
                        Ember.run.later(this, 'load', 0);
                    } else {
                        this.load();
                    }
                }
                return this._super.apply(this, arguments);
            };
        }
        function passThrough(key, defaultValue) {
            return Ember.computed(function (key, value) {
                var content = get(this, 'content');
                if (arguments.length === 1) {
                    if (content) {
                        return get(content, key);
                    } else {
                        return defaultValue;
                    }
                }
                if (content) {
                    return set(content, key, value);
                }
                return value;
            }).property('content.' + key);
        }
        function passThroughMethod(name, defaultReturn) {
            return function () {
                var content = get(this, 'content');
                if (!content)
                    return defaultReturn;
                return content[name].apply(content, arguments);
            };
        }
        Ep.ModelProxy = Ember.ObjectProxy.extend(Ember.Copyable, Ep.ModelMixin, {
            id: passThrough('id'),
            clientId: passThrough('clientId'),
            rev: passThrough('rev'),
            clientRev: passThrough('clientRev'),
            type: passThrough('type'),
            isDirty: false,
            isPromise: false,
            isLoaded: passThrough('isLoaded', false),
            isLoading: false,
            isDeleted: passThrough('isDeleted', false),
            isNew: passThrough('isNew', false),
            isProxy: true,
            errors: passThrough('errors'),
            copy: function () {
                var content = get(this, 'content');
                if (content) {
                    return content.copy();
                }
                return this.lazyCopy();
            }
        });
        Ep.LoadError = Ep.ModelProxy.extend({});
        Ep.ModelPromise = Ep.ModelProxy.extend(Ember.DeferredMixin, {
            isPromise: true,
            isNew: false,
            resolve: function (model) {
                set(this, 'content', model);
                return this._super.apply(this, arguments);
            },
            hasIdentifiers: Ember.computed(function () {
                return get(this, 'type') && (get(this, 'id') || get(this, 'clientId'));
            }).volatile(),
            toStringExtension: function () {
                var content = get(this, 'content');
                if (content) {
                    return content.toString();
                } else if (get(this, 'hasIdentifiers')) {
                    var type = get(this, 'type');
                    return '(unloaded ' + type.toString() + '):' + this._super();
                } else {
                    return '(no identifiers)';
                }
            },
            diff: passThroughMethod('diff', []),
            suspendRelationshipObservers: passThroughMethod('suspendRelationshipObservers'),
            eachAttribute: passThroughMethod('eachAttribute'),
            eachRelationship: passThroughMethod('eachRelationship'),
            _registerRelationships: passThroughMethod('_registerRelationships')
        });
        Ep.LazyModel = Ep.ModelPromise.extend({
            willWatchProperty: triggerLoad(true),
            unknownProperty: triggerLoad(),
            setUnknownProperty: triggerLoad(),
            then: triggerLoad(true),
            resolve: function () {
                set(this, 'isLoading', false);
                return this._super.apply(this, arguments);
            },
            load: function () {
                if (get(this, 'isLoading'))
                    return this;
                var session = get(this, 'session');
                var type = get(this, 'type');
                var id = get(this, 'id');
                set(this, 'isLoading', true);
                Ember.assert('Must be attached to a session.', get(this, 'session'));
                Ember.assert('Must have an id to load.', id);
                var promise = this.session.load(type, id);
                if (get(promise, 'isLoaded')) {
                    this.resolve(Ep.unwrap(promise));
                } else {
                    var proxy = this;
                    promise.then(function (model) {
                        proxy.resolve(model);
                        return model;
                    }, function (err) {
                        proxy.reject(err);
                        return err;
                    });
                }
                return this;
            }
        });
        Ep.unwrap = function (modelOrPromise) {
            if (get(modelOrPromise, 'isProxy')) {
                return get(modelOrPromise, 'content');
            }
            return modelOrPromise;
        };
        Ep.resolveModel = function (modelOrPromise, type, id, session) {
            if (modelOrPromise instanceof Ep.ModelPromise) {
                return modelOrPromise;
            }
            id = get(modelOrPromise, 'id') || id;
            var clientId = get(modelOrPromise, 'clientId');
            type = get(modelOrPromise, 'type') || type;
            session = get(modelOrPromise, 'session') || session;
            var promise = Ep.ModelPromise.create({
                    id: id,
                    clientId: clientId,
                    type: type,
                    session: session
                });
            if (typeof modelOrPromise.then !== 'function') {
                promise.resolve(modelOrPromise);
            } else {
                modelOrPromise.then(function (model) {
                    promise.resolve(model);
                    return model;
                }, function (err) {
                    promise.reject(err);
                    throw err;
                });
            }
            return promise;
        };
    });
    require.define('/lib/rest/rest_adapter.js', function (module, exports, __dirname, __filename) {
        require('/lib/adapter.js', module);
        require('/lib/rest/embedded_manager.js', module);
        require('/lib/rest/operation_graph.js', module);
        require('/lib/rest/rest_errors.js', module);
        var get = Ember.get, set = Ember.set;
        Ep.RestAdapter = Ep.Adapter.extend({
            init: function () {
                this._super.apply(this, arguments);
                this._embeddedManager = Ep.EmbeddedManager.create({ adapter: this });
                this._pendingOps = {};
            },
            load: function (type, id) {
                var root = this.rootForType(type), adapter = this;
                return this.ajax(this.buildURL(root, id), 'GET').then(function (json) {
                    return Ember.run(adapter, 'didReceiveDataForLoad', json, type, id);
                }, function (xhr) {
                    var model = Ep.LoadError.create({
                            id: id,
                            type: type
                        });
                    throw Ember.run(adapter, 'didError', xhr, model);
                });
            },
            refresh: function (model) {
                var type = get(model, 'type');
                var root = this.rootForType(type), adapter = this;
                var id = get(model, 'id');
                return this.ajax(this.buildURL(root, id), 'GET').then(function (json) {
                    return Ember.run(adapter, 'didReceiveData', json, model);
                }, function (xhr) {
                    throw Ember.run(adapter, 'didError', xhr, model);
                });
            },
            update: function (model) {
                var id, root, adapter, data, type = get(model, 'type');
                id = get(model, 'id');
                root = this.rootForType(type);
                adapter = this;
                data = {};
                data[root] = get(this, 'serializer').serialize(model);
                return this.ajax(this.buildURL(root, id), 'PUT', { data: data }).then(function (json) {
                    return Ember.run(adapter, 'didReceiveData', json, model);
                }, function (xhr) {
                    throw Ember.run(adapter, 'didError', xhr, model);
                });
            },
            create: function (model) {
                var type = get(model, 'type');
                var root = this.rootForType(type);
                var adapter = this;
                var data = {};
                data[root] = get(this, 'serializer').serialize(model, { includeId: true });
                return this.ajax(this.buildURL(root), 'POST', { data: data }).then(function (json) {
                    return Ember.run(adapter, 'didReceiveData', json, model);
                }, function (xhr) {
                    throw Ember.run(adapter, 'didError', xhr, model);
                });
            },
            deleteModel: function (model) {
                var id, root, adapter, type = get(model, 'type');
                id = get(model, 'id');
                root = this.rootForType(type);
                adapter = this;
                return this.ajax(this.buildURL(root, id), 'DELETE').then(function (json) {
                    return Ember.run(adapter, 'didReceiveData', json, model);
                }, function (xhr) {
                    throw Ember.run(adapter, 'didError', xhr, model);
                });
            },
            query: function (type, query) {
                var root = this.rootForType(type), adapter = this;
                return this.ajax(this.buildURL(root), 'GET', { data: query }).then(function (json) {
                    return Ember.run(adapter, 'didReceiveDataForFind', json, type);
                }, function (xhr) {
                    throw xhr;
                });
            },
            remoteCall: function (context, name, params) {
                var url, adapter = this;
                if (typeof context === 'string') {
                    context = this.lookupType(context);
                }
                if (typeof context === 'function') {
                    url = this.buildURL(this.rootForType(context));
                } else {
                    var id = get(context, 'id');
                    Ember.assert('Cannot perform a remote call with a context that doesn\'t have an id', id);
                    url = this.buildURL(this.rootForType(context.constructor), id);
                }
                url = url + '/' + name;
                var data = params;
                var method = 'POST';
                return this.ajax(url, method, { data: data }).then(function (json) {
                    return Ember.run(adapter, 'didReceiveDataForRpc', json, context);
                }, function (xhr) {
                    throw Ember.run(adapter, 'didError', xhr, context);
                });
            },
            lookupType: function (type) {
                return this.container.lookup('model:' + type);
            },
            didReceiveData: function (data, targetModel) {
                var result = null;
                this.processData(data, function (model) {
                    if (targetModel && model.isEqual(targetModel)) {
                        result = model;
                    }
                });
                return result;
            },
            didReceiveDataForLoad: function (data, type, id) {
                var result = null;
                this.processData(data, function (model) {
                    if (model.hasType(type) && get(model, 'id') === id) {
                        result = model;
                    }
                });
                return result;
            },
            didReceiveDataForFind: function (data, type) {
                var result = [];
                this.processData(data, function (model) {
                    if (model.hasType(type)) {
                        result.pushObject(model);
                    }
                });
                return Ep.ModelArray.create({ content: result });
            },
            didReceiveDataForRpc: function (data, context) {
                return this.didReceiveData(data, context);
            },
            processData: function (data, callback, binding) {
                var models = get(this, 'serializer').deserialize(data);
                models.forEach(function (model) {
                    this.willLoadModel(model);
                }, this);
                models.forEach(function (model) {
                    this.didLoadModel(model);
                    callback.call(binding || this, model);
                }, this);
                this.materializeRelationships(models);
            },
            willLoadModel: function (model) {
                model.eachRelatedModel(function (relative) {
                    if (get(relative, 'clientId')) {
                        this.reifyClientId(model);
                    }
                }, this);
            },
            didLoadModel: function (model) {
                model.eachRelatedModel(function (relative) {
                    this.reifyClientId(relative);
                }, this);
                this._embeddedManager.updateParents(model);
            },
            didError: function (xhr, model) {
                var errors;
                if (xhr.status === 422) {
                    var json = JSON.parse(xhr.responseText), serializer = get(this, 'serializer'), validationErrors = serializer.extractValidationErrors(get(model, 'type'), json);
                    errors = Ep.RestErrors.create({ content: validationErrors });
                } else {
                    errors = Ep.RestErrors.create();
                }
                set(errors, 'status', xhr.status);
                set(errors, 'xhr', xhr);
                set(model, 'errors', errors);
                throw model;
            },
            flush: function (session) {
                var models = get(session, 'dirtyModels').copy(true);
                var shadows = Ep.ModelSet.fromArray(models.map(function (model) {
                        return session.shadows.getModel(model);
                    }));
                this.dirtyEmbedded(models, shadows, session);
                this.removeEmbeddedOrphans(models, shadows, session);
                this.materializeRelationships(models);
                var op = Ep.OperationGraph.create({
                        models: models,
                        shadows: shadows,
                        adapter: this
                    });
                return this._performFlush(op);
            },
            _performFlush: function (op) {
                var models = get(op, 'models'), pending = Ember.Set.create();
                models.forEach(function (model) {
                    var op = this._pendingOps[model.clientId];
                    if (op)
                        pending.add(op);
                }, this);
                var adapter = this;
                if (get(pending, 'length') > 0) {
                    return Ember.RSVP.all(pending.toArray()).then(function () {
                        return adapter._performFlush(op);
                    });
                }
                var promise = op.perform();
                models.forEach(function (model) {
                    this._pendingOps[model.clientId] = promise;
                }, this);
                return promise.then(function (res) {
                    models.forEach(function (model) {
                        delete adapter._pendingOps[model.clientId];
                    });
                    return res;
                }, function (err) {
                    models.forEach(function (model) {
                        delete adapter._pendingOps[model.clientId];
                    });
                    throw err;
                });
            },
            rebuildRelationships: function (children, parent) {
                var serializer = get(this, 'serializer');
                parent.suspendRelationshipObservers(function () {
                    for (var i = 0; i < children.length; i++) {
                        var child = children[i];
                        child.eachRelationship(function (name, relationship) {
                            if (relationship.kind === 'belongsTo') {
                                var value = get(child, name);
                                var inverse = child.constructor.inverseFor(name);
                                if (inverse) {
                                    if (serializer.embeddedType(inverse.type, inverse.name)) {
                                        return;
                                    }
                                    if (inverse.kind === 'hasMany') {
                                        var parentCollection = get(parent, inverse.name);
                                        if (child.get('isDeleted')) {
                                            parentCollection.removeObject(child);
                                        } else if (value && value.isEqual(parent)) {
                                            parentCollection.addObject(child);
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
            },
            isRelationshipOwner: function (relationship) {
                var serializer = get(this, 'serializer');
                var owner = serializer.mappingOption(relationship.parentType, relationship.key, 'owner');
                return relationship.kind === 'belongsTo' && owner !== false || relationship.kind === 'hasMany' && owner === true;
            },
            isDirtyFromRelationships: function (model, cached, relDiff) {
                var serializer = get(this, 'serializer');
                for (var i = 0; i < relDiff.length; i++) {
                    var diff = relDiff[i];
                    if (this.isRelationshipOwner(diff.relationship) || serializer.embeddedType(model.constructor, diff.name) === 'always') {
                        return true;
                    }
                }
                return false;
            },
            shouldSave: function (model) {
                return !this.isEmbedded(model);
            },
            isEmbedded: function (model) {
                return this._embeddedManager.isEmbedded(model);
            },
            removeEmbeddedOrphans: function (models, shadows, session) {
                var orphans = [];
                models.forEach(function (model) {
                    if (!this.isEmbedded(model))
                        return;
                    var root = this.findEmbeddedRoot(model, models);
                    if (!root || root.isEqual(model)) {
                        orphans.push(model);
                    }
                }, this);
                models.removeObjects(orphans);
                shadows.removeObjects(orphans);
            },
            dirtyEmbedded: function (models, shadows, session) {
                this.dirtyEmbeddedParents(models, shadows, session);
                models.forEach(function (model) {
                    this.dirtyEmbeddedTree(model, models, shadows, session);
                }, this);
            },
            dirtyEmbeddedParents: function (models, shadows, session) {
                models.forEach(function (model) {
                    var parent;
                    while (parent = this._embeddedManager.findParent(model)) {
                        model = session.getModel(parent);
                        if (!models.contains(model)) {
                            var copy = model.copy();
                            models.add(copy);
                            shadows.add(copy);
                        }
                    }
                    this._embeddedManager.updateParents(model);
                }, this);
            },
            dirtyEmbeddedTree: function (model, models, shadows, session) {
                get(this, 'serializer').eachEmbeddedRecord(model, function (embeddedRecord, embeddedType) {
                    if (embeddedType !== 'always') {
                        return;
                    }
                    if (models.contains(embeddedRecord)) {
                        return;
                    }
                    embeddedRecord = session.getModel(embeddedRecord);
                    if (!embeddedRecord)
                        return;
                    if (!models.contains(embeddedRecord)) {
                        var copy = embeddedRecord.copy();
                        models.add(copy);
                        shadows.add(copy);
                    }
                    this.dirtyEmbeddedTree(embeddedRecord, models, shadows, session);
                }, this);
            },
            findEmbeddedRoot: function (model, models) {
                var parent = model;
                while (parent) {
                    model = parent;
                    parent = this._embeddedManager.findParent(model);
                }
                return models.getModel(model);
            },
            materializeRelationships: function (models) {
                if (!(models instanceof Ep.ModelSet)) {
                    models = Ep.ModelSet.fromArray(models);
                }
                models.forEach(function (model) {
                    model.eachRelationship(function (name, relationship) {
                        if (relationship.kind === 'belongsTo') {
                            var child = get(model, name);
                            if (child) {
                                child = models.getModel(child) || child;
                                set(model, name, child);
                            }
                        } else if (relationship.kind === 'hasMany') {
                            var children = get(model, name);
                            var lazyChildren = Ep.ModelSet.create();
                            lazyChildren.addObjects(children);
                            children.clear();
                            lazyChildren.forEach(function (child) {
                                child = models.getModel(child) || child;
                                children.addObject(child);
                            });
                        }
                    }, this);
                }, this);
            },
            ajax: function (url, type, hash) {
                try {
                    hash = hash || {};
                    hash.url = url;
                    hash.type = type;
                    hash.dataType = 'json';
                    hash.context = this;
                    if (hash.data && type !== 'GET') {
                        hash.contentType = 'application/json; charset=utf-8';
                        hash.data = JSON.stringify(hash.data);
                    }
                    return Ember.RSVP.resolve(jQuery.ajax(hash));
                } catch (error) {
                    return Ember.RSVP.resolve(error);
                }
            },
            url: '',
            rootForType: function (type) {
                var serializer = get(this, 'serializer');
                return serializer.rootForType(type);
            },
            pluralize: function (string) {
                var serializer = get(this, 'serializer');
                return serializer.pluralize(string);
            },
            buildURL: function (record, suffix) {
                var url = [this.url];
                Ember.assert('Namespace URL (' + this.namespace + ') must not start with slash', !this.namespace || this.namespace.toString().charAt(0) !== '/');
                Ember.assert('Record URL (' + record + ') must not start with slash', !record || record.toString().charAt(0) !== '/');
                Ember.assert('URL suffix (' + suffix + ') must not start with slash', !suffix || suffix.toString().charAt(0) !== '/');
                if (!Ember.isNone(this.namespace)) {
                    url.push(this.namespace);
                }
                url.push(this.pluralize(record));
                if (suffix !== undefined) {
                    url.push(suffix);
                }
                return url.join('/');
            }
        });
    });
    require.define('/lib/rest/rest_errors.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.RestErrors = Ep.Errors.extend({
            status: null,
            xhr: null,
            copy: function () {
                return Ep.RestErrors.create({
                    content: Ember.copy(this.content),
                    status: this.status,
                    xhr: this.xhr
                });
            }
        });
    });
    require.define('/lib/rest/operation_graph.js', function (module, exports, __dirname, __filename) {
        require('/lib/rest/operation.js', module);
        var get = Ember.get, set = Ember.set;
        Ep.OperationGraph = Ember.Object.extend({
            models: null,
            shadows: null,
            rootOps: null,
            adapter: null,
            init: function () {
                var graph = this;
                this.ops = Ember.MapWithDefault.create({
                    defaultValue: function (model) {
                        return Ep.Operation.create({
                            model: model,
                            graph: graph,
                            adapter: get(graph, 'adapter')
                        });
                    }
                });
                this.rootOps = Ember.Set.create();
                this.build();
            },
            perform: function () {
                return this.createPromise();
            },
            build: function () {
                var adapter = get(this, 'adapter');
                var serializer = get(adapter, 'serializer');
                var models = get(this, 'models');
                var shadows = get(this, 'shadows');
                var rootOps = get(this, 'rootOps');
                var ops = get(this, 'ops');
                models.forEach(function (model) {
                    if (!get(model, 'isLoaded')) {
                        return;
                    }
                    var shadow = shadows.getModel(model);
                    Ember.assert('Shadow does not exist for non-new model', shadow || get(model, 'isNew'));
                    var op = ops.get(model);
                    set(op, 'shadow', shadow);
                    var isEmbedded = adapter.isEmbedded(model);
                    if (get(op, 'isDirty') && isEmbedded) {
                        var rootModel = adapter.findEmbeddedRoot(model, models);
                        var rootOp = this.getOp(rootModel);
                        set(rootOp, 'force', true);
                        var parentModel = adapter._embeddedManager.findParent(model);
                        var parentOp = this.getOp(parentModel);
                        parentOp.addChild(op);
                    }
                    var rels = get(op, 'dirtyRelationships');
                    for (var i = 0; i < rels.length; i++) {
                        var d = rels[i];
                        var name = d.name;
                        var parentModel = model.get(name) || shadows.getModel(d.oldValue);
                        var isEmbeddedRel = serializer.embeddedType(get(model, 'type'), name);
                        if (parentModel && !isEmbeddedRel) {
                            var parentOp = this.getOp(parentModel);
                            parentOp.addChild(op);
                        }
                    }
                }, this);
                ops.forEach(function (model, op) {
                    if (get(op, 'isDirty') && get(op, 'isRoot')) {
                        rootOps.add(op);
                    }
                }, this);
            },
            getOp: function (model) {
                var models = get(this, 'models');
                var materializedModel = models.getModel(model);
                if (materializedModel)
                    model = materializedModel;
                return this.ops.get(model);
            },
            createPromise: function () {
                var rootOps = get(this, 'rootOps'), adapter = get(this, 'adapter'), cumulative = [];
                function createNestedPromise(op) {
                    var promise = op.perform();
                    promise = promise.then(function (model) {
                        cumulative.push(model);
                        return model;
                    }, function (model) {
                        cumulative.push(model);
                        throw model;
                    });
                    if (op.children.length > 0) {
                        promise = promise.then(function (model) {
                            var childPromises = op.children.map(createNestedPromise);
                            return Ember.RSVP.all(childPromises).then(function (models) {
                                adapter.rebuildRelationships(models, model);
                                return model;
                            });
                        });
                    }
                    return promise;
                }
                return Ember.RSVP.all(rootOps.map(createNestedPromise)).then(function () {
                    return cumulative;
                }, function (err) {
                    throw cumulative;
                });
            },
            toStringExtension: function () {
                var result = '';
                var rootOps = get(this, 'rootOps');
                rootOps.forEach(function (op) {
                    result += '\n' + op.toString(1);
                });
                return result + '\n';
            }
        });
    });
    require.define('/lib/rest/operation.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.Operation = Ember.Object.extend({
            model: null,
            shadow: null,
            adapter: null,
            _promise: null,
            force: false,
            init: function () {
                this.children = Ember.Set.create();
                this.parents = Ember.Set.create();
            },
            dirtyRelationships: Ember.computed(function () {
                var adapter = get(this, 'adapter'), model = get(this, 'model'), rels = [], shadow = get(this, 'shadow');
                if (get(model, 'isNew')) {
                    model.eachRelationship(function (name, relationship) {
                        if (adapter.isRelationshipOwner(relationship)) {
                            rels.push({
                                name: name,
                                type: relationship.kind,
                                relationship: relationship,
                                oldValue: null
                            });
                        }
                    }, this);
                } else {
                    var diff = model.diff(shadow);
                    for (var i = 0; i < diff.length; i++) {
                        var d = diff[i];
                        if (d.relationship && adapter.isRelationshipOwner(d.relationship)) {
                            rels.push(d);
                        }
                    }
                }
                return rels;
            }),
            isDirty: Ember.computed(function () {
                return !!get(this, 'dirtyType');
            }),
            isDirtyFromUpdates: Ember.computed(function () {
                var model = get(this, 'model'), shadow = get(this, 'shadow'), adapter = get(this, 'adapter');
                var diff = model.diff(shadow);
                var dirty = false;
                var relDiff = [];
                for (var i = 0; i < diff.length; i++) {
                    var d = diff[i];
                    if (d.type == 'attr') {
                        dirty = true;
                    } else {
                        relDiff.push(d);
                    }
                }
                return dirty || adapter.isDirtyFromRelationships(model, shadow, relDiff);
            }),
            dirtyType: Ember.computed(function () {
                var model = get(this, 'model');
                if (get(model, 'isNew')) {
                    return 'created';
                } else if (get(model, 'isDeleted')) {
                    return 'deleted';
                } else if (get(this, 'isDirtyFromUpdates') || get(this, 'force')) {
                    return 'updated';
                }
            }),
            perform: function () {
                if (this._promise)
                    return this._promise;
                var adapter = get(this, 'adapter'), dirtyType = get(this, 'dirtyType'), model = get(this, 'model'), shadow = get(this, 'shadow'), promise;
                if (!dirtyType || !adapter.shouldSave(model)) {
                    if (adapter.isEmbedded(model)) {
                        promise = this._promiseFromEmbeddedParent();
                    } else {
                        promise = Ember.RSVP.resolve();
                    }
                } else if (dirtyType === 'created') {
                    promise = adapter.create(model);
                } else if (dirtyType === 'updated') {
                    promise = adapter.update(model);
                } else if (dirtyType === 'deleted') {
                    promise = adapter.deleteModel(model);
                }
                promise = promise.then(function (serverModel) {
                    if (!get(model, 'id')) {
                        set(model, 'id', get(serverModel, 'id'));
                    }
                    if (!serverModel) {
                        serverModel = model;
                    } else if (!get(serverModel, 'clientRev')) {
                        set(serverModel, 'clientRev', get(model, 'clientRev'));
                    }
                    return serverModel;
                }, function (serverModel) {
                    if (shadow) {
                        shadow.set('errors', serverModel.get('errors'));
                        throw shadow;
                    }
                    throw serverModel;
                });
                return this._promise = promise;
            },
            _embeddedParent: Ember.computed(function () {
                var model = get(this, 'model'), parentModel = get(this, 'adapter')._embeddedManager.findParent(model), graph = get(this, 'graph');
                Ember.assert('Embedded parent does not exist!', parentModel);
                return graph.getOp(parentModel);
            }),
            _promiseFromEmbeddedParent: function () {
                var serializer = get(this, 'adapter.serializer');
                var model = this.model;
                function findInParent(parentModel) {
                    var res = null;
                    serializer.eachEmbeddedRecord(parentModel, function (child, embeddedType) {
                        if (res)
                            return;
                        if (child.isEqual(model))
                            res = child;
                    });
                    return res;
                }
                return get(this, '_embeddedParent').perform().then(function (parent) {
                    return findInParent(parent);
                }, function (parent) {
                    throw findInParent(parent);
                });
            },
            toStringExtension: function () {
                return '( ' + get(this, 'dirtyType') + ' ' + get(this, 'model') + ' )';
            },
            addChild: function (child) {
                this.children.add(child);
                child.parents.add(this);
            },
            isRoot: Ember.computed(function () {
                return this.parents.every(function (parent) {
                    return !get(parent, 'isDirty') && get(parent, 'isRoot');
                });
            }).volatile()
        });
    });
    require.define('/lib/rest/embedded_manager.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.EmbeddedManager = Ember.Object.extend({
            adapter: null,
            init: function () {
                this._super.apply(this, arguments);
                this._parentMap = {};
                this._cachedIsEmbedded = Ember.Map.create();
            },
            updateParents: function (model) {
                var serializer = get(this, 'adapter.serializer');
                var parentType = get(model, 'type');
                serializer.eachEmbeddedRecord(model, function (embedded, kind) {
                    this._parentMap[get(embedded, 'clientId')] = model;
                }, this);
            },
            findParent: function (model) {
                var parent = this._parentMap[get(model, 'clientId')];
                return parent;
            },
            isEmbedded: function (model) {
                var type = get(model, 'type');
                var result = this._cachedIsEmbedded.get(type);
                if (result === true || result === false)
                    return result;
                var adapter = get(this, 'adapter');
                var mappings = get(adapter, 'serializer.mappings');
                var result = false;
                mappings.forEach(function (parentType, value) {
                    for (var name in value) {
                        var embedded = value[name]['embedded'];
                        result = result || embedded === 'always' && parentType.typeForRelationship(name).detect(type);
                    }
                });
                this._cachedIsEmbedded.set(type, result);
                return result;
            }
        });
    });
    require.define('/lib/adapter.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set, merge = Ember.merge;
        require('/lib/mixins/mappable.js', module);
        function mustImplement(name) {
            return function () {
                throw new Ember.Error('Your serializer ' + this.toString() + ' does not implement the required method ' + name);
            };
        }
        var uuid = 1;
        Ep.Adapter = Ember.Object.extend(Ep._Mappable, {
            init: function () {
                this._super.apply(this, arguments);
                this.idMaps = Ember.MapWithDefault.create({
                    defaultValue: function (type) {
                        return Ember.Map.create();
                    }
                });
            },
            newSession: function () {
                var session = this.container.lookup('session:base');
                set(session, 'adapter', this);
                return session;
            },
            serializer: Ember.computed(function (key, serializer) {
                this._attributesMap = this.createInstanceMapFor('attributes');
                this._configurationsMap = this.createInstanceMapFor('configurations');
                this.registerSerializerTransforms(this.constructor, serializer, {});
                this.registerSerializerMappings(serializer);
                return serializer;
            }),
            load: mustImplement('load'),
            query: mustImplement('find'),
            refresh: mustImplement('refresh'),
            flush: mustImplement('flush'),
            remoteCall: mustImplement('remoteCall'),
            isDirtyFromRelationships: function (model, cached, relDiff) {
                return relDiff.length > 0;
            },
            shouldSave: function (model) {
                return true;
            },
            registerSerializerTransforms: function (klass, serializer, seen) {
                var transforms = klass._registeredTransforms, superclass, prop;
                var enumTransforms = klass._registeredEnumTransforms;
                for (prop in transforms) {
                    if (!transforms.hasOwnProperty(prop) || prop in seen) {
                        continue;
                    }
                    seen[prop] = true;
                    serializer.registerTransform(prop, transforms[prop]);
                }
                for (prop in enumTransforms) {
                    if (!enumTransforms.hasOwnProperty(prop) || prop in seen) {
                        continue;
                    }
                    seen[prop] = true;
                    serializer.registerEnumTransform(prop, enumTransforms[prop]);
                }
                if (superclass = klass.superclass) {
                    this.registerSerializerTransforms(superclass, serializer, seen);
                }
            },
            registerSerializerMappings: function (serializer) {
                var mappings = this._attributesMap, configurations = this._configurationsMap;
                mappings.forEach(serializer.map, serializer);
                configurations.forEach(serializer.configure, serializer);
            },
            reifyClientId: function (model) {
                var id = get(model, 'id'), clientId = get(model, 'clientId'), type = get(model, 'type'), idMap = this.idMaps.get(type);
                if (id && clientId) {
                    var existingClientId = idMap.get(id);
                    Ember.assert('clientId has changed for ' + model.toString(), !existingClientId || existingClientId === clientId);
                    if (!existingClientId) {
                        idMap.set(id, clientId);
                    }
                } else if (!clientId) {
                    if (id) {
                        clientId = idMap.get(id);
                    }
                    if (!clientId) {
                        clientId = this._generateClientId(type);
                    }
                    set(model, 'clientId', clientId);
                    idMap.set(id, clientId);
                }
                return clientId;
            },
            getClientId: function (type, id) {
                var idMap = this.idMaps.get(type);
                return idMap.get(id);
            },
            _generateClientId: function (type) {
                return this._typeToString(type) + uuid++;
            },
            _typeToString: function (type) {
                return type.toString().split('.')[1].underscore();
            }
        });
        Ep.Adapter.reopenClass({
            registerTransform: function (attributeType, transform) {
                var registeredTransforms = this._registeredTransforms || {};
                registeredTransforms[attributeType] = transform;
                this._registeredTransforms = registeredTransforms;
            },
            registerEnumTransform: function (attributeType, objects) {
                var registeredEnumTransforms = this._registeredEnumTransforms || {};
                registeredEnumTransforms[attributeType] = objects;
                this._registeredEnumTransforms = registeredEnumTransforms;
            },
            map: Ep._Mappable.generateMapFunctionFor('attributes', function (key, newValue, map) {
                var existingValue = map.get(key);
                merge(existingValue, newValue);
            }),
            configure: Ep._Mappable.generateMapFunctionFor('configurations', function (key, newValue, map) {
                var existingValue = map.get(key);
                var mappings = newValue && newValue.mappings;
                if (mappings) {
                    this.map(key, mappings);
                    delete newValue.mappings;
                }
                merge(existingValue, newValue);
            }),
            resolveMapConflict: function (oldValue, newValue) {
                merge(newValue, oldValue);
                return newValue;
            }
        });
    });
    require.define('/lib/mixins/mappable.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get;
        var resolveMapConflict = function (oldValue, newValue) {
            return oldValue;
        };
        var transformMapKey = function (key, value) {
            return key;
        };
        var transformMapValue = function (key, value) {
            return value;
        };
        Ep._Mappable = Ember.Mixin.create({
            createInstanceMapFor: function (mapName) {
                var instanceMeta = getMappableMeta(this);
                instanceMeta.values = instanceMeta.values || {};
                if (instanceMeta.values[mapName]) {
                    return instanceMeta.values[mapName];
                }
                var instanceMap = instanceMeta.values[mapName] = new Ember.Map();
                var klass = this.constructor;
                while (klass && klass !== Ep.Store) {
                    this._copyMap(mapName, klass, instanceMap);
                    klass = klass.superclass;
                }
                instanceMeta.values[mapName] = instanceMap;
                return instanceMap;
            },
            _copyMap: function (mapName, klass, instanceMap) {
                var classMeta = getMappableMeta(klass);
                var classMap = classMeta[mapName];
                if (classMap) {
                    classMap.forEach(eachMap, this);
                }
                function eachMap(key, value) {
                    var transformedKey = (klass.transformMapKey || transformMapKey)(key, value);
                    var transformedValue = (klass.transformMapValue || transformMapValue)(key, value);
                    var oldValue = instanceMap.get(transformedKey);
                    var newValue = transformedValue;
                    if (oldValue) {
                        newValue = (this.constructor.resolveMapConflict || resolveMapConflict)(oldValue, newValue);
                    }
                    instanceMap.set(transformedKey, newValue);
                }
            }
        });
        Ep._Mappable.generateMapFunctionFor = function (mapName, transform) {
            return function (key, value) {
                var meta = getMappableMeta(this);
                var map = meta[mapName] || Ember.MapWithDefault.create({
                        defaultValue: function () {
                            return {};
                        }
                    });
                transform.call(this, key, value, map);
                meta[mapName] = map;
            };
        };
        function getMappableMeta(obj) {
            var meta = Ember.meta(obj, true), keyName = 'Ep.Mappable', value = meta[keyName];
            if (!value) {
                meta[keyName] = {};
            }
            if (!meta.hasOwnProperty(keyName)) {
                meta[keyName] = Ember.create(meta[keyName]);
            }
            return meta[keyName];
        }
    });
    require.define('/lib/local/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/local/local_adapter.js', module);
    });
    require.define('/lib/local/local_adapter.js', function (module, exports, __dirname, __filename) {
        require('/lib/adapter.js', module);
        var get = Ember.get, set = Ember.set;
        Ep.LocalAdapter = Ep.Adapter.extend({
            serializer: Ep.Serializer.create(),
            load: function (type, id) {
                return Ember.RSVP.resolve(null);
            },
            refresh: function (model) {
                return Ember.RSVP.resolve(model.copy());
            },
            flush: function (session) {
                var models = get(session, 'dirtyModels');
                return Ember.RSVP.resolve(models.copy(true));
            }
        });
    });
    require.define('/lib/session/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/session/session.js', module);
        require('/lib/session/merge.js', module);
        require('/lib/session/child_session.js', module);
    });
    require.define('/lib/session/child_session.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.ChildSession = Ep.Session.extend({
            load: function (type, id) {
                if (typeof type === 'string') {
                    type = this.lookupType(type);
                }
                id = id.toString();
                var cached = this.getForId(type, id);
                if (cached && get(cached, 'isLoaded')) {
                    return Ep.resolveModel(cached);
                }
                var parentModel = get(this, 'parent').getForId(type, id);
                if (parentModel && get(parentModel, 'isLoaded')) {
                    return Ep.resolveModel(this.merge(parentModel));
                }
                var session = this;
                return Ep.resolveModel(this.parent.load(type, id).then(function (model) {
                    return session.merge(model);
                }, function (model) {
                    throw session.merge(model);
                }), type, id, session);
            },
            query: function (type, query) {
                var session = this;
                return this.parent.query(type, query).then(function (models) {
                    var merged = Ep.ModelArray.create({
                            session: session,
                            content: []
                        });
                    set(merged, 'meta', get(models, 'meta'));
                    models.forEach(function (model) {
                        merged.addObject(session.merge(model));
                    });
                    return merged;
                });
            },
            refresh: function (model) {
                var session = this;
                return this.parent.refresh(model).then(function (refreshedModel) {
                    return session.merge(refreshedModel);
                }, function (refreshedModel) {
                    throw session.merge(refreshedModel);
                });
            },
            flush: function () {
                var session = this, dirtyModels = get(this, 'dirtyModels'), shadows = get(this, 'shadows'), parent = this.parent;
                var dirty = get(this, 'dirtyModels');
                dirty.forEach(function (model) {
                    parent.update(model);
                });
                var promise = parent.flush().then(function (models) {
                        var res = models.map(function (model) {
                                return session.merge(model);
                            });
                        return models;
                    }, function (models) {
                        var res = models.map(function (model) {
                                return session.merge(model);
                            });
                        throw models;
                    });
                dirtyModels.forEach(function (model) {
                    this.shadows.add(model.copy());
                }, this);
                return promise;
            },
            reifyClientId: function (model) {
                return this.parent.reifyClientId(model);
            },
            getForId: function (type, id) {
                var adapter = get(this.parent, 'adapter');
                var clientId = adapter.getClientId(type, id);
                return this.models.getForClientId(clientId);
            },
            remoteCall: function (context, name) {
                var session = this;
                return this.parent.remoteCall.apply(this.parent, arguments).then(function (model) {
                    return session.merge(model);
                }, function (model) {
                    throw session.merge(model);
                });
            }
        });
    });
    require.define('/lib/session/merge.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.Session.reopen({
            merge: function (model, strategy) {
                this.reifyClientId(model);
                if (get(model, 'hasErrors')) {
                    return this._mergeError(model, strategy);
                } else {
                    return this._mergeSuccess(model, strategy);
                }
            },
            _mergeSuccess: function (model, strategy) {
                var models = get(this, 'models'), shadows = get(this, 'shadows'), newModels = get(this, 'newModels'), originals = get(this, 'originals'), merged, ancestor, existing = models.getModel(model);
                if (existing && this._containsRev(existing, model)) {
                    return existing;
                }
                var hasClientChanges = !existing || this._containsClientRev(model, existing);
                if (hasClientChanges) {
                    ancestor = shadows.getModel(model);
                } else {
                    ancestor = originals.getModel(model);
                }
                this.suspendDirtyChecking(function () {
                    merged = this._mergeModel(existing, ancestor, model, strategy);
                }, this);
                if (hasClientChanges) {
                    if (get(merged, 'isDeleted')) {
                        this.remove(merged);
                    } else {
                        if (shadows.contains(model) && get(model, 'isLoaded')) {
                            shadows.add(model);
                        }
                        originals.remove(model);
                        if (!get(merged, 'isNew')) {
                            newModels.remove(merged);
                        }
                    }
                } else {
                }
                return merged;
            },
            _mergeError: function (model, strategy) {
                var models = get(this, 'models'), shadows = get(this, 'shadows'), newModels = get(this, 'newModels'), originals = get(this, 'originals'), merged, ancestor, existing = models.getModel(model);
                if (!existing) {
                    Ember.assert('Errors returned for non-existant model: ' + model.toString(), model instanceof Ep.LoadError);
                    return model;
                }
                ancestor = originals.getModel(model);
                if (ancestor && !this._containsRev(existing, model)) {
                    this.suspendDirtyChecking(function () {
                        merged = this._mergeModel(existing, ancestor, model, strategy);
                    }, this);
                } else {
                    merged = existing;
                }
                set(merged, 'errors', Ember.copy(get(model, 'errors')));
                if (get(model, 'isLoaded')) {
                    shadows.add(model);
                    originals.remove(model);
                }
                return merged;
            },
            _mergeModel: function (dest, ancestor, model, strategy) {
                if (!strategy)
                    strategy = get(this, 'mergeStrategy').create({ session: this });
                if (model === dest) {
                    return model;
                }
                if (get(model, 'isPromise')) {
                    return this._mergePromise(dest, ancestor, model, strategy);
                }
                var promise;
                if (dest && get(dest, 'isPromise')) {
                    promise = dest;
                    dest = dest.content;
                }
                if (!dest) {
                    dest = model.constructor.create();
                    if (promise) {
                        promise.resolve(dest);
                    }
                }
                if (!get(model, 'hasErrors')) {
                    set(dest, 'isNew', false);
                }
                set(dest, 'id', get(model, 'id'));
                set(dest, 'clientId', get(model, 'clientId'));
                set(dest, 'rev', get(model, 'rev'));
                set(dest, 'isDeleted', get(model, 'isDeleted'));
                this.adopt(dest);
                if (!ancestor) {
                    ancestor = dest;
                }
                strategy.merge(dest, ancestor, model);
                return dest;
            },
            _mergePromise: function (dest, ancestor, promise, strategy) {
                var content = get(promise, 'content');
                if (content) {
                    return this._mergeModel(dest, ancestor, content, strategy);
                }
                if (!dest) {
                    dest = promise.lazyCopy();
                    this.adopt(dest);
                }
                return dest;
            },
            _containsRev: function (modelA, modelB) {
                if (!get(modelA, 'rev'))
                    return false;
                if (!get(modelB, 'rev'))
                    return false;
                return get(modelA, 'rev') >= get(modelB, 'rev');
            },
            _containsClientRev: function (modelA, modelB) {
                return get(modelA, 'clientRev') >= get(modelB, 'clientRev');
            }
        });
    });
    require.define('/lib/session/session.js', function (module, exports, __dirname, __filename) {
        require('/lib/collections/model_array.js', module);
        require('/lib/collections/model_set.js', module);
        require('/lib/session/collection_manager.js', module);
        require('/lib/session/belongs_to_manager.js', module);
        require('/lib/model/index.js', module);
        require('/lib/session/merge_strategies/index.js', module);
        var get = Ember.get, set = Ember.set;
        Ep.Session = Ember.Object.extend({
            mergeStrategy: Ep.PerField,
            _dirtyCheckingSuspended: false,
            init: function () {
                this._super.apply(this, arguments);
                this.models = Ep.ModelSet.create();
                this.collectionManager = Ep.CollectionManager.create();
                this.belongsToManager = Ep.BelongsToManager.create();
                this.shadows = Ep.ModelSet.create();
                this.originals = Ep.ModelSet.create();
                this.newModels = Ep.ModelSet.create();
            },
            create: function (type, hash) {
                if (typeof type === 'string') {
                    type = this.lookupType(type);
                }
                var model = type.create(hash);
                model = this.add(model);
                model._registerRelationships();
                return model;
            },
            adopt: function (model) {
                Ember.assert('Models instances cannot be moved between sessions. Use `add` or `update` instead.', !get(model, 'session') || get(model, 'session') === this);
                set(model, 'session', this);
                if (get(model, 'isNew')) {
                    this.newModels.add(model);
                }
                this.models.add(model);
                model._registerRelationships();
                return model;
            },
            add: function (model, depth) {
                this.reifyClientId(model);
                var dest = this.getModel(model);
                if (dest && get(dest, 'isLoaded'))
                    return dest;
                if (typeof depth === 'undefined') {
                    depth = 2;
                }
                depth--;
                if (get(model, 'isProxy')) {
                    var content = get(model, 'content');
                    if (content) {
                        return this.add(content);
                    }
                    dest = model.lazyCopy();
                    return this.adopt(dest);
                }
                if (get(model, 'isDetached')) {
                    dest = model;
                } else {
                    dest = model.constructor.create();
                    model.copyAttributes(dest);
                }
                this.adopt(dest);
                model.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        var child = get(model, name);
                        if (child) {
                            if (get(child, 'session') === this) {
                                model.belongsToDidChange(model, name);
                            } else {
                                if (depth >= 0 || get(child, 'isDetached') || get(child, 'isNew')) {
                                    child = this.add(child, depth);
                                } else {
                                    child = child.lazyCopy();
                                }
                                dest.suspendRelationshipObservers(function () {
                                    set(dest, name, child);
                                });
                            }
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var children = get(model, name);
                        var copied = children.map(function (child) {
                                if (depth >= 0 || get(child, 'isDetached') || get(child, 'isNew')) {
                                    child = this.add(child, depth);
                                } else {
                                    child = child.lazyCopy();
                                }
                                return child;
                            }, this);
                        set(dest, name, copied);
                    }
                }, this);
                return dest;
            },
            remove: function (model) {
                get(this, 'models').remove(model);
                get(this, 'shadows').remove(model);
                get(this, 'originals').remove(model);
            },
            update: function (model) {
                this.reifyClientId(model);
                if (get(model, 'isProxy')) {
                    var content = get(model, 'content');
                    if (content) {
                        return this.update(content);
                    }
                    throw new Ember.Error('Cannot update with an unloaded model: ' + model.toString());
                }
                var dest = this.getModel(model);
                if (get(model, 'isDetached') || !dest || !get(dest, 'isLoaded')) {
                    return this.add(model);
                }
                if (get(model, 'isDeleted')) {
                    if (!get(dest, 'isDeleted')) {
                        this.deleteModel(dest);
                    }
                    return dest;
                }
                model.copyAttributes(dest);
                model.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        var child = get(model, name);
                        if (child) {
                            set(dest, name, child);
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var children = get(model, name);
                        var destChildren = get(dest, name);
                        children.copyTo(destChildren);
                    }
                }, this);
                return dest;
            },
            deleteModel: function (model) {
                if (get(model, 'isNew')) {
                    var newModels = get(this, 'newModels');
                    newModels.remove(model);
                } else {
                    this.modelWillBecomeDirty(model);
                }
                set(model, 'isDeleted', true);
                this.collectionManager.modelWasDeleted(model);
                this.belongsToManager.modelWasDeleted(model);
            },
            load: function (type, id) {
                if (typeof type === 'string') {
                    type = this.lookupType(type);
                }
                id = id.toString();
                var cached = this.getForId(type, id);
                if (cached && get(cached, 'isLoaded')) {
                    return Ep.resolveModel(cached);
                }
                var session = this;
                return Ep.resolveModel(this.adapter.load(type, id).then(function (model) {
                    return session.merge(model);
                }, function (model) {
                    throw session.merge(model);
                }), type, id, session);
            },
            find: function (type, query) {
                if (Ember.typeOf(query) === 'object') {
                    return this.query(type, query);
                }
                return this.load(type, query);
            },
            query: function (type, query) {
                if (typeof type === 'string') {
                    type = this.lookupType(type);
                }
                var session = this;
                return this.adapter.query(type, query).then(function (models) {
                    var merged = Ep.ModelArray.create({
                            session: session,
                            content: []
                        });
                    set(merged, 'meta', get(models, 'meta'));
                    models.forEach(function (model) {
                        merged.addObject(session.merge(model));
                    });
                    return merged;
                });
            },
            refresh: function (model) {
                var session = this;
                return this.adapter.refresh(model).then(function (refreshedModel) {
                    return session.merge(refreshedModel);
                }, function (refreshedModel) {
                    throw session.merge(refreshedModel);
                });
            },
            flush: function () {
                var session = this, dirtyModels = get(this, 'dirtyModels'), newModels = get(this, 'newModels'), shadows = get(this, 'shadows');
                dirtyModels.forEach(function (model) {
                    model.incrementProperty('clientRev');
                }, this);
                var promise = this.adapter.flush(this).then(function (models) {
                        var res = models.map(function (model) {
                                return session.merge(model);
                            });
                        return res;
                    }, function (models) {
                        var res = models.map(function (model) {
                                return session.merge(model);
                            });
                        throw res;
                    });
                dirtyModels.forEach(function (model) {
                    var original = this.originals.getModel(model);
                    var shadow = this.shadows.getModel(model);
                    if (shadow && (!original || original.get('rev') < shadow.get('rev'))) {
                        this.originals.add(shadow);
                    }
                    this.shadows.remove(model);
                }, this);
                newModels.clear();
                return promise;
            },
            getModel: function (model) {
                return this.models.getModel(model);
            },
            getForId: function (type, id) {
                var clientId = this.adapter.getClientId(type, id);
                return this.models.getForClientId(clientId);
            },
            reifyClientId: function (model) {
                this.adapter.reifyClientId(model);
            },
            remoteCall: function (context, name) {
                var session = this;
                return this.adapter.remoteCall.apply(this.adapter, arguments).then(function (model) {
                    return session.merge(model);
                }, function (model) {
                    throw session.merge(model);
                });
            },
            modelWillBecomeDirty: function (model) {
                if (this._dirtyCheckingSuspended || get(model, 'isNew')) {
                    return;
                }
                var shadow = this.shadows.getModel(model);
                if (!shadow) {
                    shadow = model.copy();
                    this.shadows.addObject(shadow);
                }
            },
            destroy: function () {
                this._super();
                this.models.forEach(function (model) {
                    model.destroy();
                });
                this.models.destroy();
                this.collectionManager.destroy();
                this.belongsToManager.destroy();
                this.shadows.destroy();
                this.originals.destroy();
                this.newModels.destroy();
            },
            dirtyModels: Ember.computed(function () {
                var models = Ep.ModelSet.fromArray(this.shadows.map(function (model) {
                        return this.models.getModel(model);
                    }, this));
                get(this, 'newModels').forEach(function (model) {
                    models.add(model);
                });
                return models;
            }).volatile(),
            suspendDirtyChecking: function (callback, binding) {
                var self = this;
                if (this._dirtyCheckingSuspended) {
                    return callback.call(binding || self);
                }
                try {
                    this._dirtyCheckingSuspended = true;
                    return callback.call(binding || self);
                } finally {
                    this._dirtyCheckingSuspended = false;
                }
            },
            newSession: function () {
                var child = this.container.lookup('session:child');
                set(child, 'parent', this);
                return child;
            },
            lookupType: function (type) {
                return this.container.lookup('model:' + type);
            },
            getShadow: function (model) {
                var shadows = get(this, 'shadows');
                var models = get(this, 'models');
                return shadows.getModel(model) || models.getModel(model);
            }
        });
    });
    require.define('/lib/session/merge_strategies/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/session/merge_strategies/merge_strategy.js', module);
        require('/lib/session/merge_strategies/theirs.js', module);
        require('/lib/session/merge_strategies/per_field.js', module);
    });
    require.define('/lib/session/merge_strategies/per_field.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set, isEqual = Ember.isEqual;
        function mergeIfPresent(session, model, strategy) {
            if (!model)
                return null;
            return session.merge(model, strategy);
        }
        Ep.PerField = Ep.MergeStrategy.extend({
            init: function () {
                this.cache = Ep.ModelSet.create();
            },
            merge: function (ours, ancestor, theirs) {
                if (this.cache.contains(ours))
                    return ours;
                this.cache.addObject(theirs);
                ours.beginPropertyChanges();
                this.mergeAttributes(ours, ancestor, theirs);
                this.mergeRelationships(ours, ancestor, theirs);
                ours.endPropertyChanges();
                return ours;
            },
            mergeAttributes: function (ours, ancestor, theirs) {
                ours.eachAttribute(function (name, meta) {
                    var oursValue = get(ours, name);
                    var theirsValue = get(theirs, name);
                    var originalValue = get(ancestor, name);
                    if (oursValue === theirsValue)
                        return;
                    if (oursValue === originalValue) {
                        set(ours, name, theirsValue);
                    }
                });
            },
            mergeRelationships: function (ours, ancestor, theirs) {
                var session = get(this, 'session');
                ours.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        var oursValue = get(ours, name);
                        var theirsValue = get(theirs, name);
                        var originalValue = get(ancestor, name);
                        var merged = mergeIfPresent(session, theirsValue, this);
                        if (isEqual(oursValue, originalValue)) {
                            set(ours, name, merged);
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var theirChildren = get(theirs, name);
                        var ourChildren = get(ours, name);
                        var originalChildren = get(ancestor, name);
                        if (isEqual(ourChildren, originalChildren)) {
                            var existing = Ep.ModelSet.create();
                            existing.addObjects(ourChildren);
                            theirChildren.forEach(function (model) {
                                if (existing.contains(model)) {
                                    session.merge(model, this);
                                    existing.remove(model);
                                } else {
                                    ourChildren.addObject(session.merge(model, this));
                                }
                            }, this);
                            ourChildren.removeObjects(existing);
                        } else {
                            theirChildren.forEach(function (model) {
                                session.merge(model, this);
                            }, this);
                        }
                    }
                }, this);
            }
        });
    });
    require.define('/lib/session/merge_strategies/theirs.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.Theirs = Ep.MergeStrategy.extend({
            init: function () {
                this.cache = Ep.ModelSet.create();
            },
            merge: function (dest, ancestor, model) {
                if (this.cache.contains(model))
                    return dest;
                this.cache.addObject(model);
                dest.beginPropertyChanges();
                this.copyAttributes(model, dest);
                this.copyRelationships(model, dest);
                dest.endPropertyChanges();
                return dest;
            },
            copyAttributes: function (model, dest) {
                model.eachAttribute(function (name, meta) {
                    var left = get(model, name);
                    var right = get(dest, name);
                    if (left !== right)
                        set(dest, name, left);
                });
            },
            copyRelationships: function (model, dest) {
                var session = get(this, 'session');
                model.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        var child = get(model, name);
                        var destChild = get(dest, name);
                        if (child && destChild) {
                            session.merge(child, this);
                        } else if (child) {
                            set(dest, name, session.merge(child, this));
                        } else if (destChild) {
                            set(dest, name, null);
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var children = get(model, name);
                        var destChildren = get(dest, name);
                        var modelSet = Ep.ModelSet.create();
                        modelSet.addObjects(destChildren);
                        set(destChildren, 'meta', get(children, 'meta'));
                        children.forEach(function (child) {
                            if (modelSet.contains(child)) {
                                session.merge(child, this);
                                modelSet.remove(child);
                            } else {
                                destChildren.addObject(session.merge(child, this));
                            }
                        }, this);
                        destChildren.removeObjects(modelSet);
                    }
                }, this);
            }
        });
    });
    require.define('/lib/session/merge_strategies/merge_strategy.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        function mustImplement(name) {
            return function () {
                throw new Ember.Error('Your serializer ' + this.toString() + ' does not implement the required method ' + name);
            };
        }
        Ep.MergeStrategy = Ember.Object.extend({
            session: null,
            merge: mustImplement('merge')
        });
    });
    require.define('/lib/session/belongs_to_manager.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.BelongsToManager = Ember.Object.extend({
            init: function () {
                this.modelMap = Ember.MapWithDefault.create({
                    defaultValue: function () {
                        return Ember.A([]);
                    }
                });
            },
            register: function (parent, key, model) {
                var paths = this.modelMap.get(get(model, 'clientId'));
                var path = paths.find(function (p) {
                        return p.parent.isEqual(parent) && p.key === key;
                    });
                if (path)
                    return;
                path = {
                    parent: parent,
                    key: key
                };
                paths.pushObject(path);
            },
            unregister: function (parent, key, model) {
                var paths = this.modelMap.get(get(model, 'clientId'));
                var path = paths.find(function (p) {
                        return p.parent.isEqual(parent) && p.key === key;
                    });
                paths.removeObject(path);
                if (paths.length === 0) {
                    this.modelMap.remove(get(model, 'clientId'));
                }
            },
            modelWasDeleted: function (model) {
                var paths = this.modelMap.get(get(model, 'clientId')).copy();
                paths.forEach(function (path) {
                    set(path.parent, path.key, null);
                });
            }
        });
    });
    require.define('/lib/session/collection_manager.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.CollectionManager = Ember.Object.extend({
            init: function () {
                this.modelMap = Ember.MapWithDefault.create({
                    defaultValue: function () {
                        return Ember.A([]);
                    }
                });
            },
            register: function (array, model) {
                var arrays = this.modelMap.get(get(model, 'clientId'));
                if (arrays.contains(array))
                    return;
                arrays.pushObject(array);
            },
            unregister: function (array, model) {
                var arrays = this.modelMap.get(get(model, 'clientId'));
                arrays.removeObject(array);
                if (arrays.length === 0) {
                    this.modelMap.remove(get(model, 'clientId'));
                }
            },
            modelWasDeleted: function (model) {
                var arrays = this.modelMap.get(get(model, 'clientId')).copy();
                arrays.forEach(function (array) {
                    array.removeObject(model);
                });
            }
        });
    });
    require.define('/lib/initializer.js', function (module, exports, __dirname, __filename) {
        var set = Ember.set;
        if (Ember.DefaultResolver) {
            Ember.DefaultResolver.reopen({
                resolveModel: function (parsedName) {
                    var className = Ember.String.classify(parsedName.name);
                    return Ember.get(parsedName.root, className);
                }
            });
        }
        Ember.onLoad('Ember.Application', function (Application) {
            Application.initializer({
                name: 'epf',
                initialize: function (container, application) {
                    Ep.__container__ = container;
                    application.register('store:main', application.Store || Ep.Store);
                    application.register('adapter:main', application.Adapter || Ep.RestAdapter);
                    application.register('session:base', application.Session || Ep.Session, { singleton: false });
                    application.register('session:child', application.ChildSession || Ep.ChildSession, { singleton: false });
                    application.register('session:main', application.DefaultSession || Ep.Session);
                    application.register('serializer:main', application.Serializer || Ep.RestSerializer);
                    application.inject('adapter', 'serializer', 'serializer:main');
                    application.inject('session', 'adapter', 'adapter:main');
                    container.optionsForType('model', { instantiate: false });
                    application.inject('controller', 'adapter', 'adapter:main');
                    application.inject('controller', 'session', 'session:main');
                    application.inject('route', 'adapter', 'adapter:main');
                    application.inject('route', 'session', 'session:main');
                }
            });
        });
    });
    require.define('/lib/version.js', function (module, exports, __dirname, __filename) {
        Ep.VERSION = '0.1.3';
    });
    global.epf = require('/lib/index.js');
}.call(this, this));
/*
//@ sourceMappingURL=epf.js.map
*/