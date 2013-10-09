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
                version: 'v0.10.17',
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
        require('/vendor/ember-inflector.js', module);
        global.Ep = Ember.Namespace.create();
        require('/lib/version.js', module);
        require('/lib/initializers.js', module);
        require('/lib/model/index.js', module);
        require('/lib/session/index.js', module);
        require('/lib/serializer/index.js', module);
        require('/lib/transforms/index.js', module);
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
            metaKey: 'meta',
            deserializePayload: function (hash, context) {
                var result = [], metaKey = get(this, 'metaKey');
                for (var prop in hash) {
                    if (!hash.hasOwnProperty(prop) || prop === metaKey) {
                        continue;
                    }
                    var type = this.typeFor(prop);
                    Ember.assert('Your server returned a hash with the key ' + prop + ' but has no corresponding type.', !!type);
                    var value = hash[prop];
                    if (value instanceof Array) {
                        for (var i = 0; i < value.length; i++) {
                            result.push(this.deserialize(type, value[i]));
                        }
                    } else {
                        result.push(this.deserialize(type, value));
                    }
                }
                return result;
            },
            keyForBelongsTo: function (name, type) {
                var key = this._super(name, type);
                if (this.embeddedType(type, name)) {
                    return key;
                }
                return key + '_id';
            },
            keyForHasMany: function (name, type) {
                var key = this._super(name, type);
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
                    var key = this.keyFor(name, type);
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
        require('/lib/serializer/json_serializer/index.js', module);
    });
    require.define('/lib/serializer/json_serializer/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/serializer/json_serializer/embedded_helpers_mixin.js', module);
        require('/lib/serializer/json_serializer/json_serializer.js', module);
        require('/lib/serializer/json_serializer/serialize.js', module);
        require('/lib/serializer/json_serializer/deserialize.js', module);
    });
    require.define('/lib/serializer/json_serializer/deserialize.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        function extractPropertyHook(name) {
            return function (type, hash) {
                return this.extractProperty(type, hash, name);
            };
        }
        Ep.JsonSerializer.reopen({
            deserialize: function (type, hash) {
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
            extractProperty: function (type, hash, name) {
                var key = this.keyFor(name, type);
                return hash[key];
            },
            extractId: function (type, hash) {
                var key = this.keyFor('id', type);
                if (hash.hasOwnProperty(key)) {
                    return hash[key] + '';
                } else {
                    return null;
                }
            },
            extractClientId: extractPropertyHook('clientId'),
            extractRevision: extractPropertyHook('rev'),
            extractClientRevision: extractPropertyHook('clientRev'),
            deserializeAttributes: function (model, hash) {
                model.eachAttribute(function (name, attribute) {
                    set(model, name, this.extractAttribute(model, hash, name, attribute));
                }, this);
            },
            extractAttribute: function (model, hash, name, attribute) {
                var key = this.keyFor(name, get(model, 'type'));
                return this.deserializeValue(hash[key], attribute.type);
            },
            deserializeValue: function (value, attributeType) {
                var transform = this.transformFor(attributeType);
                Ember.assert('You tried to use a attribute type (' + attributeType + ') that has not been registered', transform);
                return transform.deserialize(value);
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
                var type = get(model, 'type'), key = this.keyForHasMany(name, type), embeddedType = this.embeddedType(type, name), value = this.extractHasMany(type, data, key);
                if (embeddedType) {
                    this.deserializeEmbeddedHasMany(name, model, value, relationship);
                } else {
                    this.deserializeLazyHasMany(name, model, value, relationship);
                }
            },
            deserializeEmbeddedHasMany: function (name, model, values, relationship) {
                if (!values) {
                    return;
                }
                get(model, name).pushObjects(values.map(function (data) {
                    var type = this.extractEmbeddedType(relationship, data);
                    return this.deserialize(type, data);
                }, this));
            },
            deserializeLazyHasMany: function (name, model, values, relationship) {
                if (!values) {
                    return;
                }
                get(model, name).pushObjects(values.map(function (value) {
                    return Ep.LazyModel.create({
                        id: value && value.toString(),
                        type: relationship.type
                    });
                }, this));
            },
            deserializeBelongsTo: function (name, model, hash, relationship) {
                var type = get(model, 'type'), key = this.keyForBelongsTo(name, type), embeddedType = this.embeddedType(type, name), value;
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
                var child = this.deserialize(type, value);
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
                var foundType = relationship.type;
                if (relationship.options && relationship.options.polymorphic) {
                    var key = this.keyForRelationship(relationship), keyForEmbeddedType = this.keyForEmbeddedType(key);
                    foundType = this.typeFromAlias(data[keyForEmbeddedType]);
                    delete data[keyForEmbeddedType];
                }
                return foundType;
            },
            extractHasMany: Ember.aliasMethod('extractProperty'),
            extractBelongsTo: Ember.aliasMethod('extractProperty')
        });
    });
    require.define('/lib/serializer/json_serializer/serialize.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        function addPropertyHook(name) {
            return function (serialized, model) {
                return this.addProperty(serialized, name, model);
            };
        }
        Ep.JsonSerializer.reopen({
            serialize: function (model, options) {
                var serialized = {}, id, rev, clientRev;
                if (id = get(model, 'id')) {
                    this.addId(serialized, model);
                }
                this.addClientId(serialized, model);
                if (rev = get(model, 'rev')) {
                    this.addRevision(serialized, model);
                }
                if (clientRev = get(model, 'clientRev')) {
                    this.addClientRevision(serialized, model);
                }
                if (options && options.includeType) {
                    this.addType(serialized, model);
                }
                this.addAttributes(serialized, model);
                this.addRelationships(serialized, model);
                return serialized;
            },
            addProperty: function (serialized, name, model) {
                var key = this.keyFor(name);
                serialized[key] = get(model, name);
            },
            addId: function (serialized, model) {
                var key = this.keyFor('id');
                serialized[key] = this.serializeId(get(model, 'id'));
            },
            serializeId: function (id) {
                if (isNaN(id)) {
                    return id;
                }
                return +id;
            },
            addClientId: addPropertyHook('clientId'),
            addRevision: addPropertyHook('rev'),
            addClientRevision: addPropertyHook('clientRev'),
            addType: addPropertyHook('type'),
            addAttributes: function (serialized, model) {
                model.eachAttribute(function (name, attribute) {
                    this.addAttribute(serialized, name, model, attribute);
                }, this);
            },
            addAttribute: function (serialized, name, model, attribute) {
                var key = this.keyFor(name);
                serialized[key] = this.serializeValue(get(model, name), attribute.type);
            },
            serializeValue: function (value, attributeType) {
                var transform = this.transformFor(attributeType);
                Ember.assert('You tried to use an attribute type (' + attributeType + ') that has not been registered', transform);
                return transform.serialize(value);
            },
            addRelationships: function (serialized, model) {
                model.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        this.addBelongsTo(serialized, model, name, relationship);
                    } else if (relationship.kind === 'hasMany') {
                        this.addHasMany(serialized, model, name, relationship);
                    }
                }, this);
            },
            addBelongsTo: function (serialized, model, name, relationship) {
                var type = get(model, 'type'), key = this.keyForBelongsTo(name, type), value = null, includeType = relationship.options && relationship.options.polymorphic, embeddedChild, child, id;
                if (this.embeddedType(type, name)) {
                    if (embeddedChild = get(model, name)) {
                        value = this.serialize(embeddedChild, { includeType: includeType });
                    }
                    serialized[key] = value;
                } else {
                    child = get(model, relationship.key);
                    id = get(child, 'id');
                    if (relationship.options && relationship.options.polymorphic && !Ember.isNone(id)) {
                        throw 'Polymorphism is not quite ready';
                    } else {
                        serialized[key] = id === undefined ? null : this.serializeId(id);
                    }
                }
            },
            addBelongsToPolymorphic: function (hash, key, id, type) {
                var keyForId = this.keyForPolymorphicId(key), keyForType = this.keyForPolymorphicType(key);
                hash[keyForId] = id;
                hash[keyForType] = this.rootForType(type);
            },
            rootForType: function (type) {
                return get(type, 'typeKey');
            },
            addHasMany: function (serialized, model, name, relationship) {
                var type = get(model, 'type'), key = this.keyForHasMany(name, type), serializedHasMany = [], includeType = relationship.options && relationship.options.polymorphic, manyArray, embeddedType;
                embeddedType = this.embeddedType(type, name);
                if (embeddedType !== 'always') {
                    return;
                }
                manyArray = get(model, name);
                manyArray.forEach(function (model) {
                    serializedHasMany.push(this.serialize(model, { includeType: includeType }));
                }, this);
                serialized[key] = serializedHasMany;
            }
        });
    });
    require.define('/lib/serializer/json_serializer/json_serializer.js', function (module, exports, __dirname, __filename) {
        require('/lib/serializer/serializer.js', module);
        var get = Ember.get, set = Ember.set;
        Ep.JsonSerializer = Ep.Serializer.extend(Ep.EmbeddedHelpersMixin, {
            mergedProperties: [
                'properties',
                'aliases'
            ],
            properties: {},
            aliases: {},
            _keyCache: null,
            _nameCache: null,
            init: function () {
                this._super();
                this._keyCache = {};
                this._nameCache = {};
            },
            nameFor: function (key) {
                var name;
                if (name = this._nameCache[key]) {
                    return name;
                }
                var configs = get(this, 'properties');
                for (var currentName in configs) {
                    var current = configs[name];
                    var keyName = current.key;
                    if (keyName && key === keyName) {
                        name = currentName;
                    }
                }
                name = name || Ember.String.camelize(key);
                this._nameCache[key] = name;
                return name;
            },
            configFor: function (name) {
                return this.properties[name] || {};
            },
            keyFor: function (name, type) {
                var key;
                if (key = this._keyCache[name]) {
                    return key;
                }
                var config = this.configFor(name);
                key = config.key || Ember.String.underscore(name);
                this._keyCache[name] = key;
                return key;
            },
            keyForBelongsTo: Ember.aliasMethod('keyFor'),
            keyForHasMany: Ember.aliasMethod('keyFor'),
            keyForRelationship: function (relationship) {
                var type = relationship.parentType, name = relationship.key;
                switch (description.kind) {
                case 'belongsTo':
                    return this.keyForBelongsTo(name, type);
                case 'hasMany':
                    return this.keyForHasMany(name, type);
                }
            },
            keyForEmbeddedType: function () {
                return 'type';
            },
            transformFor: function (attributeType) {
                return this.container.lookup('transform:' + attributeType);
            },
            pluralize: function (name) {
                return Ember.String.pluralize(name);
            },
            singularize: function (name) {
                return Ember.String.singularize(name);
            },
            typeFor: function (name) {
                var type;
                if (type = this.container.lookup('model:' + name)) {
                    return type;
                }
                var singular = this.singularize(name);
                if (type = this.container.lookup('model:' + singular)) {
                    return type;
                }
                var aliases = get(this, 'aliases');
                var alias = aliases[name];
                return alias && this.container.lookup('model:' + alias);
            }
        });
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
            deserialize: mustImplement('deserialize'),
            serialize: mustImplement('serialize')
        });
    });
    require.define('/lib/model/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/model/model.js', module);
        require('/lib/model/proxies.js', module);
        require('/lib/model/attribute.js', module);
        require('/lib/model/debug.js', module);
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
                        var child = get(this, name);
                        if (child) {
                            session.reifyClientId(child);
                            session.belongsToManager.register(this, name, child);
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var children = get(this, name);
                        children.forEach(function (child) {
                            session.reifyClientId(child);
                            session.collectionManager.register(children, child);
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
            }
        });
        Ep.ModelMixin.reopen({
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
            },
            eachChild: function (callback, binding) {
                this.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        var child = get(this, name);
                        if (child) {
                            callback.call(binding, child);
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var children = get(this, name);
                        children.forEach(function (child) {
                            callback.call(binding, child);
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
                    content: content
                });
            }).property().meta(meta);
        };
        Ep.HasManyArray = Ep.ModelArray.extend({
            name: null,
            owner: null,
            session: Ember.computed.alias('owner.session'),
            replaceContent: function (idx, amt, objects) {
                var session = get(this, 'session');
                if (session) {
                    objects = objects.map(function (model) {
                        return session.add(model);
                    });
                }
                this._super(idx, amt, objects);
            },
            objectAtContent: function (index) {
                var content = get(this, 'content'), model = content.objectAt(index), session = get(this, 'session');
                if (session && model) {
                    return session.add(model);
                }
                return model;
            },
            arrayContentWillChange: function (index, removed, added) {
                var owner = get(this, 'owner'), name = get(this, 'name'), session = get(this, 'session');
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
                            }, this);
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
                                    var session = get(this, 'session');
                                    if (session) {
                                        session.belongsToManager.register(model, inverse.name, owner);
                                    }
                                }
                            }, this);
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
                    var session = get(this, 'session');
                    if (session) {
                        session.collectionManager.unregister(this, model);
                    }
                }
                this._super.apply(this, arguments);
            },
            arrayContentDidChange: function (index, removed, added) {
                this._super.apply(this, arguments);
                for (var i = index; i < index + added; i++) {
                    var model = this.objectAt(i);
                    var session = get(this, 'session');
                    if (session) {
                        session.collectionManager.register(this, model);
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
                        dest.pushObject(model);
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
            isDeleted: false,
            isLoaded: true,
            isNew: Ember.computed(function () {
                return !get(this, 'id');
            }).property('id'),
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
                this.copyMeta(dest);
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
                            destChildren.pushObject(child.lazyCopy());
                        });
                    }
                }, this);
                dest.endPropertyChanges();
                return dest;
            },
            copyAttributes: function (dest) {
                dest.beginPropertyChanges();
                this.eachAttribute(function (name, meta) {
                    var left = get(this, name);
                    var right = get(dest, name);
                    set(dest, name, left);
                }, this);
                dest.endPropertyChanges();
            },
            copyMeta: function (dest) {
                set(dest, 'id', get(this, 'id'));
                set(dest, 'clientId', get(this, 'clientId'));
                set(dest, 'rev', get(this, 'rev'));
                set(dest, 'clientRev', get(this, 'clientRev'));
                set(dest, 'errors', Ember.copy(get(this, 'errors')));
                set(dest, 'isDeleted', get(this, 'isDeleted'));
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
            },
            typeKey: Ember.computed(function () {
                return Ember.String.underscore(this.toString().split('.')[1]);
            })
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
        function BelongsToDescriptor(func, opts) {
            Ember.ComputedProperty.apply(this, arguments);
        }
        BelongsToDescriptor.prototype = new Ember.ComputedProperty();
        BelongsToDescriptor.prototype.get = function (obj, keyName) {
            if (!get(obj, 'isDetached') && this._suspended !== obj) {
                var ret, cache, cached, meta, session, existing;
                meta = Ember.meta(obj);
                cache = meta.cache;
                session = get(obj, 'session');
                if ((cached = cache[keyName]) && (existing = session.fetch(cached)) && existing !== cached) {
                    cache[keyName] = existing;
                }
            }
            return Ember.ComputedProperty.prototype.get.apply(this, arguments);
        };
        Ep.belongsTo = function (type, options) {
            Ember.assert('The type passed to Ep.belongsTo must be defined', !!type);
            options = options || {};
            var meta = {
                    type: type,
                    isRelationship: true,
                    options: options,
                    kind: 'belongsTo'
                };
            return new BelongsToDescriptor(function (key, value) {
                if (arguments.length === 1) {
                    return null;
                } else {
                    var session = get(this, 'session');
                    if (value && session) {
                        value = session.add(value);
                    }
                    return value;
                }
            }).meta(meta);
        };
        Ep.Model.reopen({
            init: function () {
                this._super();
                this.eachRelationship(function (name, relationship) {
                    if (relationship.kind === 'belongsTo') {
                        this.belongsToDidChange(this, name);
                    }
                }, this);
            },
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
    require.define('/lib/model/debug.js', function (module, exports, __dirname, __filename) {
        Ep.Model.reopen({
            _debugInfo: function () {
                var attributes = ['id'], relationships = {
                        belongsTo: [],
                        hasMany: []
                    }, expensiveProperties = [];
                this.eachAttribute(function (name, meta) {
                    attributes.push(name);
                }, this);
                this.eachRelationship(function (name, relationship) {
                    relationships[relationship.kind].push(name);
                    expensiveProperties.push(name);
                });
                var groups = [
                        {
                            name: 'Attributes',
                            properties: attributes,
                            expand: true
                        },
                        {
                            name: 'Belongs To',
                            properties: relationships.belongsTo,
                            expand: true
                        },
                        {
                            name: 'Has Many',
                            properties: relationships.hasMany,
                            expand: true
                        },
                        {
                            name: 'Flags',
                            properties: [
                                'isLoaded',
                                'isDirty',
                                'isDeleted',
                                'isNew',
                                'isPromise',
                                'isProxy'
                            ]
                        }
                    ];
                return {
                    propertyInfo: {
                        includeOtherProperties: true,
                        groups: groups,
                        expensiveProperties: expensiveProperties
                    }
                };
            }
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
            },
            diff: passThroughMethod('diff', []),
            suspendRelationshipObservers: passThroughMethod('suspendRelationshipObservers'),
            eachAttribute: passThroughMethod('eachAttribute'),
            eachRelationship: passThroughMethod('eachRelationship'),
            _registerRelationships: passThroughMethod('_registerRelationships')
        });
        Ep.LoadError = Ep.ModelProxy.extend({});
        Ep.ModelPromise = Ep.ModelProxy.extend(Ember.DeferredMixin, {
            isPromise: true,
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
            }
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
    require.define('/lib/serializer/json_serializer/embedded_helpers_mixin.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.EmbeddedHelpersMixin = Ember.Mixin.create({
            serializerFor: function (type) {
                var key = get(type, 'typeKey');
                return this.container.lookup('serializer:' + key) || this.container.lookup('serializer:main');
            },
            embeddedType: function (type, name) {
                var serializer = this.serializerFor(type);
                if (this === serializer) {
                    var config = this.configFor(name);
                    return config.embedded;
                }
                return serializer.embeddedType(type, name);
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
            }
        });
    });
    require.define('/lib/rest/rest_adapter.js', function (module, exports, __dirname, __filename) {
        require('/lib/adapter.js', module);
        require('/lib/rest/embedded_manager.js', module);
        require('/lib/rest/operation_graph.js', module);
        require('/lib/rest/rest_errors.js', module);
        require('/lib/serializer/json_serializer/embedded_helpers_mixin.js', module);
        var get = Ember.get, set = Ember.set;
        Ep.RestAdapter = Ep.Adapter.extend(Ep.EmbeddedHelpersMixin, {
            init: function () {
                this._super.apply(this, arguments);
                this._embeddedManager = Ep.EmbeddedManager.create({ adapter: this });
                this._pendingOps = {};
            },
            load: function (type, id) {
                var root = this.rootForType(type), adapter = this;
                return this.ajax(this.buildURL(root, id), 'GET').then(function (json) {
                    return adapter.didReceiveDataForLoad(json, type, id);
                }, function (xhr) {
                    var model = Ep.LoadError.create({
                            id: id,
                            type: type
                        });
                    throw adapter.didError(xhr, model);
                });
            },
            refresh: function (model) {
                var type = get(model, 'type'), root = this.rootForType(type), id = get(model, 'id'), adapter = this;
                return this.ajax(this.buildURL(root, id), 'GET').then(function (json) {
                    return adapter.didReceiveData(json, model);
                }, function (xhr) {
                    throw adapter.didError(xhr, model);
                });
            },
            update: function (model) {
                var type = get(model, 'type'), root = this.rootForType(type), id = get(model, 'id'), adapter = this, serializer = this.serializerFor(type);
                var data = {};
                data[root] = serializer.serialize(model);
                return this.ajax(this.buildURL(root, id), 'PUT', { data: data }).then(function (json) {
                    return adapter.didReceiveData(json, model);
                }, function (xhr) {
                    throw adapter.didError(xhr, model);
                });
            },
            create: function (model) {
                var type = get(model, 'type'), root = this.rootForType(type), adapter = this, serializer = this.serializerFor(type);
                var data = {};
                data[root] = serializer.serialize(model, { includeId: true });
                return this.ajax(this.buildURL(root), 'POST', { data: data }).then(function (json) {
                    return adapter.didReceiveData(json, model);
                }, function (xhr) {
                    throw adapter.didError(xhr, model);
                });
            },
            deleteModel: function (model) {
                var type = get(model, 'type'), root = this.rootForType(type), id = get(model, 'id'), adapter = this;
                return this.ajax(this.buildURL(root, id), 'DELETE').then(function (json) {
                    return adapter.didReceiveData(json, model);
                }, function (xhr) {
                    throw adapter.didError(xhr, model);
                });
            },
            query: function (type, query) {
                var root = this.rootForType(type), adapter = this;
                return this.ajax(this.buildURL(root), 'GET', { data: query }).then(function (json) {
                    return adapter.didReceiveDataForFind(json, type);
                }, function (xhr) {
                    throw xhr;
                });
            },
            remoteCall: function (context, name, params) {
                var url, adapter = this;
                if (typeof context === 'string') {
                    context = this.typeFor(context);
                }
                if (typeof context === 'function') {
                    url = this.buildURL(this.rootForType(context));
                } else {
                    var id = get(context, 'id');
                    Ember.assert('Cannot perform a remote call with a context that doesn\'t have an id', id);
                    url = this.buildURL(this.rootForType(get(context, 'type')), id);
                }
                url = url + '/' + name;
                var data = params;
                var method = 'POST';
                return this.ajax(url, method, { data: data }).then(function (json) {
                    return adapter.didReceiveDataForRpc(json, context);
                }, function (xhr) {
                    throw adapter.didError(xhr, context);
                });
            },
            typeFor: function (typeName) {
                return this.container.lookup('model:' + typeName);
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
                var models = get(this, 'serializer').deserializePayload(data);
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
                var config = this.configFor(relationship.parentType);
                var owner = config[relationship.key] && config[relationship.key].owner;
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
                models.forEach(function (model) {
                    this.eachEmbeddedRelative(model, function (embeddedModel) {
                        this._embeddedManager.updateParents(embeddedModel);
                        if (models.contains(embeddedModel)) {
                            return;
                        }
                        embeddedModel = session.getModel(embeddedModel);
                        var copy = embeddedModel.copy();
                        models.add(copy);
                        shadows.add(copy);
                    }, this);
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
            eachEmbeddedRelative: function (model, callback, binding, visited) {
                if (!get(model, 'isLoaded'))
                    return;
                if (!visited)
                    visited = new Ember.Set();
                if (visited.contains(model))
                    return;
                visited.add(model);
                callback.call(binding, model);
                get(this, 'serializer').eachEmbeddedRecord(model, function (embeddedRecord, embeddedType) {
                    this.eachEmbeddedRelative(embeddedRecord, callback, binding, visited);
                }, this);
                var parent = this._embeddedManager.findParent(model);
                if (parent) {
                    this.eachEmbeddedRelative(parent, callback, binding, visited);
                }
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
                var adapter = this;
                return new Ember.RSVP.Promise(function (resolve, reject) {
                    hash = hash || {};
                    hash.url = url;
                    hash.type = type;
                    hash.dataType = 'json';
                    hash.context = adapter;
                    if (hash.data && type !== 'GET') {
                        hash.contentType = 'application/json; charset=utf-8';
                        hash.data = JSON.stringify(hash.data);
                    }
                    if (adapter.headers !== undefined) {
                        var headers = adapter.headers;
                        hash.beforeSend = function (xhr) {
                            forEach.call(Ember.keys(headers), function (key) {
                                xhr.setRequestHeader(key, headers[key]);
                            });
                        };
                    }
                    hash.success = function (json) {
                        Ember.run(null, resolve, json);
                    };
                    hash.error = function (jqXHR, textStatus, errorThrown) {
                        if (jqXHR) {
                            jqXHR.then = null;
                        }
                        Ember.run(null, reject, jqXHR);
                    };
                    Ember.$.ajax(hash);
                });
            },
            url: '',
            rootForType: function (type) {
                var serializer = this.serializerFor(type);
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
            },
            serializer: Ember.computed(function () {
                return container.lookup('serializer:main');
            })
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
                var type = get(model, 'type'), adapter = get(this, 'adapter'), serializer = adapter.serializerFor(type);
                serializer.eachEmbeddedRecord(model, function (embedded, kind) {
                    this._parentMap[get(embedded, 'clientId')] = model;
                }, this);
            },
            findParent: function (model) {
                var parent = this._parentMap[get(model, 'clientId')];
                return parent;
            },
            isEmbedded: function (model) {
                var type = get(model, 'type'), result = this._cachedIsEmbedded.get(type);
                if (result !== undefined)
                    return result;
                var adapter = get(this, 'adapter'), result = false;
                type.eachRelationship(function (name, relationship) {
                    var parentType = relationship.type, serializer = adapter.serializerFor(parentType), inverse = type.inverseFor(relationship.key);
                    if (!inverse)
                        return;
                    var config = serializer.configFor(inverse.name);
                    result = result || config.embedded === 'always';
                }, this);
                this._cachedIsEmbedded.set(type, result);
                return result;
            }
        });
    });
    require.define('/lib/adapter.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set, merge = Ember.merge;
        function mustImplement(name) {
            return function () {
                throw new Ember.Error('Your serializer ' + this.toString() + ' does not implement the required method ' + name);
            };
        }
        var uuid = 1;
        Ep.Adapter = Ember.Object.extend({
            mergedProperties: ['configs'],
            init: function () {
                this._super.apply(this, arguments);
                this.configs = {};
                this.idMaps = Ember.MapWithDefault.create({
                    defaultValue: function (type) {
                        return Ember.Map.create();
                    }
                });
            },
            configFor: function (type) {
                var configs = get(this, 'configs'), typeKey = get(type, 'typeKey');
                return configs[typeKey] || {};
            },
            newSession: function () {
                var session = this.container.lookup('session:base');
                set(session, 'adapter', this);
                return session;
            },
            serializerFor: function (type) {
                return this.container.lookup('serializer:' + type) || this.container.lookup('serializer:main');
            },
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
                return get(type, 'typeKey') + uuid++;
            }
        });
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
    require.define('/lib/transforms/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/transforms/base.js', module);
        require('/lib/transforms/boolean.js', module);
        require('/lib/transforms/date.js', module);
        require('/lib/transforms/number.js', module);
        require('/lib/transforms/string.js', module);
    });
    require.define('/lib/transforms/string.js', function (module, exports, __dirname, __filename) {
        var none = Ember.isNone, empty = Ember.isEmpty;
        Ep.StringTransform = Ep.Transform.extend({
            deserialize: function (serialized) {
                return none(serialized) ? null : String(serialized);
            },
            serialize: function (deserialized) {
                return none(deserialized) ? null : String(deserialized);
            }
        });
    });
    require.define('/lib/transforms/number.js', function (module, exports, __dirname, __filename) {
        var empty = Ember.isEmpty;
        Ep.NumberTransform = Ep.Transform.extend({
            deserialize: function (serialized) {
                return empty(serialized) ? null : Number(serialized);
            },
            serialize: function (deserialized) {
                return empty(deserialized) ? null : Number(deserialized);
            }
        });
    });
    require.define('/lib/transforms/date.js', function (module, exports, __dirname, __filename) {
        require('/lib/ext/date.js', module);
        Ep.DateTransform = Ep.Transform.extend({
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
        });
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
    require.define('/lib/transforms/boolean.js', function (module, exports, __dirname, __filename) {
        Ep.BooleanTransform = Ep.Transform.extend({
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
        });
    });
    require.define('/lib/transforms/base.js', function (module, exports, __dirname, __filename) {
        Ep.Transform = Ember.Object.extend({
            serialize: Ember.required(),
            deserialize: Ember.required()
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
            fetch: function (model) {
                var res = this._super(model);
                if (!res) {
                    res = get(this, 'parent').fetch(model);
                    if (res) {
                        res = this.adopt(res.copy());
                        res.eachRelationship(function (name, relationship) {
                            if (relationship.kind === 'belongsTo') {
                                var child = get(res, name);
                                if (child) {
                                    set(child, 'session', this);
                                }
                            }
                        }, this);
                    }
                }
                return res;
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
                        merged.pushObject(session.merge(model));
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
                        return res;
                    }, function (models) {
                        var res = models.map(function (model) {
                                return session.merge(model);
                            });
                        throw res;
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
            merge: function (model, strategy, visited) {
                this.reifyClientId(model);
                if (!visited)
                    visited = new Ember.Set();
                if (visited.contains(model)) {
                    return this.getModel(model);
                }
                visited.add(model);
                var detachedChildren = [];
                model.eachChild(function (child) {
                    if (get(child, 'isDetached')) {
                        detachedChildren.push(child);
                    }
                }, this);
                var merged;
                if (get(model, 'hasErrors')) {
                    merged = this._mergeError(model, strategy);
                } else {
                    merged = this._mergeSuccess(model, strategy);
                }
                for (var i = 0; i < detachedChildren.length; i++) {
                    var child = detachedChildren[i];
                    this.merge(child, strategy, visited);
                }
                return merged;
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
                if (get(model, 'isPromise')) {
                    return this._mergePromise(dest, ancestor, model, strategy);
                }
                var promise;
                if (dest && get(dest, 'isPromise')) {
                    promise = dest;
                    dest = dest.content;
                }
                if (!dest) {
                    if (get(model, 'isDetached')) {
                        dest = model;
                    } else {
                        dest = model.copy();
                    }
                    this.adopt(dest);
                    if (promise) {
                        promise.resolve(dest);
                    }
                    return dest;
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
                    if (get(promise, 'isDetached')) {
                        dest = promise;
                    } else {
                        dest = promise.lazyCopy();
                    }
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
        Ep.PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);
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
                return model;
            },
            adopt: function (model) {
                Ember.assert('Cannot adopt a model with a clientId!', get(model, 'clientId'));
                Ember.assert('Models instances cannot be moved between sessions. Use `add` or `update` instead.', !get(model, 'session') || get(model, 'session') === this);
                Ember.assert('An equivalent model already exists in the session!', !this.getModel(model) || this.getModel(model) === model);
                set(model, 'session', this);
                if (get(model, 'isNew')) {
                    this.newModels.add(model);
                }
                if (!get(model, 'isProxy')) {
                    this.models.add(model);
                    model._registerRelationships();
                }
                return model;
            },
            add: function (model) {
                this.reifyClientId(model);
                var dest = this.fetch(model);
                if (dest && get(dest, 'isLoaded'))
                    return dest;
                if (get(model, 'isProxy')) {
                    var content = get(model, 'content');
                    if (content) {
                        return this.add(content);
                    }
                }
                if (get(model, 'isNew') && get(model, 'isDetached')) {
                    dest = model;
                } else if (get(model, 'isNew')) {
                    dest = model.copy();
                } else {
                    dest = model.lazyCopy();
                }
                return this.adopt(dest);
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
                var dest = this.fetch(model);
                if (get(model, 'isNew') && !dest) {
                    dest = get(model, 'type').create();
                    set(dest, 'clientId', get(model, 'clientId'));
                    this.adopt(dest);
                }
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
                model.copyMeta(dest);
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
            fetch: function (model) {
                return this.getModel(model);
            },
            query: function (type, query) {
                if (typeof type === 'string') {
                    type = this.lookupType(type);
                }
                var session = this;
                var prom = this.adapter.query(type, query).then(function (models) {
                        var merged = Ep.ModelArray.create({
                                session: session,
                                content: []
                            });
                        set(merged, 'meta', get(models, 'meta'));
                        models.forEach(function (model) {
                            merged.pushObject(session.merge(model));
                        });
                        return merged;
                    });
                return Ep.PromiseArray.create({ promise: prom });
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
                        if (isEqual(oursValue, originalValue)) {
                            set(ours, name, theirsValue);
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
                                    existing.remove(model);
                                } else {
                                    ourChildren.pushObject(model);
                                }
                            }, this);
                            ourChildren.removeObjects(existing);
                        }
                    }
                }, this);
            }
        });
    });
    require.define('/lib/session/merge_strategies/theirs.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, set = Ember.set;
        Ep.Theirs = Ep.MergeStrategy.extend({
            merge: function (dest, ancestor, model) {
                dest.beginPropertyChanges();
                this.copyAttributes(model, dest);
                this.copyMeta(model, dest);
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
                        if (child) {
                            set(dest, name, child);
                        } else if (destChild) {
                            set(dest, name, null);
                        }
                    } else if (relationship.kind === 'hasMany') {
                        var children = get(model, name);
                        var destChildren = get(dest, name);
                        var modelSet = Ep.ModelSet.create();
                        modelSet.pushObjects(destChildren);
                        set(destChildren, 'meta', get(children, 'meta'));
                        children.forEach(function (child) {
                            if (modelSet.contains(child)) {
                                modelSet.remove(child);
                            } else {
                                destChildren.addObject(child);
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
                throw new Ember.Error('Your merge strategy ' + this.toString() + ' does not implement the required method ' + name);
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
    require.define('/lib/initializers.js', function (module, exports, __dirname, __filename) {
        var set = Ember.set;
        require('/lib/transforms/index.js', module);
        require('/lib/debug/index.js', module);
        Ember.onLoad('Ember.Application', function (Application) {
            Application.initializer({
                name: 'epf.container',
                initialize: function (container, application) {
                    Ep.__container__ = container;
                    application.register('adapter:main', application.Adapter || Ep.RestAdapter);
                    application.register('session:base', application.Session || Ep.Session, { singleton: false });
                    application.register('session:child', application.ChildSession || Ep.ChildSession, { singleton: false });
                    application.register('session:main', application.DefaultSession || Ep.Session);
                    application.register('serializer:main', application.Serializer || Ep.RestSerializer);
                    container.optionsForType('model', { instantiate: false });
                }
            });
            Application.initializer({
                name: 'epf.injections',
                initialize: function (container, application) {
                    application.inject('adapter', 'serializer', 'serializer:main');
                    application.inject('session', 'adapter', 'adapter:main');
                    application.inject('controller', 'adapter', 'adapter:main');
                    application.inject('controller', 'session', 'session:main');
                    application.inject('route', 'adapter', 'adapter:main');
                    application.inject('route', 'session', 'session:main');
                    application.inject('dataAdapter', 'session', 'session:main');
                }
            });
            Application.initializer({
                name: 'epf.transforms',
                initialize: function (container, application) {
                    application.register('transform:boolean', Ep.BooleanTransform);
                    application.register('transform:date', Ep.DateTransform);
                    application.register('transform:number', Ep.NumberTransform);
                    application.register('transform:string', Ep.StringTransform);
                }
            });
            Application.initializer({
                name: 'dataAdapter',
                initialize: function (container, application) {
                    application.register('dataAdapter:main', Ep.DebugAdapter);
                }
            });
        });
    });
    require.define('/lib/debug/index.js', function (module, exports, __dirname, __filename) {
        require('/lib/debug/debug_info.js', module);
        require('/lib/debug/debug_adapter.js', module);
    });
    require.define('/lib/debug/debug_adapter.js', function (module, exports, __dirname, __filename) {
        var get = Ember.get, capitalize = Ember.String.capitalize, underscore = Ember.String.underscore;
        if (Ember.DataAdapter) {
            var PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);
            Ep.DebugAdapter = Ember.DataAdapter.extend({
                getFilters: function () {
                    return [
                        {
                            name: 'isNew',
                            desc: 'New'
                        },
                        {
                            name: 'isModified',
                            desc: 'Modified'
                        },
                        {
                            name: 'isClean',
                            desc: 'Clean'
                        }
                    ];
                },
                detect: function (klass) {
                    return klass !== Ep.Model && Ep.Model.detect(klass);
                },
                columnsForType: function (type) {
                    var columns = [
                            {
                                name: 'id',
                                desc: 'Id'
                            },
                            {
                                name: 'clientId',
                                desc: 'Client Id'
                            },
                            {
                                name: 'rev',
                                desc: 'Revision'
                            },
                            {
                                name: 'clientRev',
                                desc: 'Client Revision'
                            }
                        ], count = 0, self = this;
                    Ember.A(get(type, 'attributes')).forEach(function (name, meta) {
                        if (count++ > self.attributeLimit) {
                            return false;
                        }
                        var desc = capitalize(underscore(name).replace('_', ' '));
                        columns.push({
                            name: name,
                            desc: desc
                        });
                    });
                    return columns;
                },
                getRecords: function (type) {
                    return PromiseArray.create({ promise: this.get('session').query(type) });
                },
                getRecordColumnValues: function (record) {
                    var self = this, count = 0, columnValues = { id: get(record, 'id') };
                    record.eachAttribute(function (key) {
                        if (count++ > self.attributeLimit) {
                            return false;
                        }
                        var value = get(record, key);
                        columnValues[key] = value;
                    });
                    return columnValues;
                },
                getRecordKeywords: function (record) {
                    var keywords = [], keys = Ember.A(['id']);
                    record.eachAttribute(function (key) {
                        keys.push(key);
                    });
                    keys.forEach(function (key) {
                        keywords.push(get(record, key));
                    });
                    return keywords;
                },
                getRecordFilterValues: function (record) {
                    return {
                        isNew: record.get('isNew'),
                        isModified: record.get('isDirty') && !record.get('isNew'),
                        isClean: !record.get('isDirty')
                    };
                },
                getRecordColor: function (record) {
                    var color = 'black';
                    if (record.get('isNew')) {
                        color = 'green';
                    } else if (record.get('isDirty')) {
                        color = 'blue';
                    }
                    return color;
                },
                observeRecord: function (record, recordUpdated) {
                    var releaseMethods = Ember.A(), self = this, keysToObserve = Ember.A([
                            'id',
                            'clientId',
                            'rev',
                            'clientRev',
                            'isNew',
                            'isDirty',
                            'isDeleted'
                        ]);
                    record.eachAttribute(function (key) {
                        keysToObserve.push(key);
                    });
                    keysToObserve.forEach(function (key) {
                        var handler = function () {
                            recordUpdated(self.wrapRecord(record));
                        };
                        Ember.addObserver(record, key, handler);
                        releaseMethods.push(function () {
                            Ember.removeObserver(record, key, handler);
                        });
                    });
                    var release = function () {
                        releaseMethods.forEach(function (fn) {
                            fn();
                        });
                    };
                    return release;
                }
            });
        }
    });
    require.define('/lib/debug/debug_info.js', function (module, exports, __dirname, __filename) {
        require('/lib/model/index.js', module);
        Ep.ModelMixin.reopen({
            _debugInfo: function () {
                var attributes = ['id'], relationships = {
                        belongsTo: [],
                        hasMany: []
                    }, expensiveProperties = [];
                this.eachAttribute(function (name, meta) {
                    attributes.push(name);
                }, this);
                this.eachRelationship(function (name, relationship) {
                    relationships[relationship.kind].push(name);
                    expensiveProperties.push(name);
                });
                var groups = [
                        {
                            name: 'Attributes',
                            properties: attributes,
                            expand: true
                        },
                        {
                            name: 'Belongs To',
                            properties: relationships.belongsTo,
                            expand: true
                        },
                        {
                            name: 'Has Many',
                            properties: relationships.hasMany,
                            expand: true
                        },
                        {
                            name: 'Flags',
                            properties: [
                                'isLoaded',
                                'isDirty',
                                'isDeleted',
                                'hasErrors',
                                'isProxy'
                            ]
                        }
                    ];
                return {
                    propertyInfo: {
                        includeOtherProperties: true,
                        groups: groups,
                        expensiveProperties: expensiveProperties
                    }
                };
            }
        });
    });
    require.define('/lib/version.js', function (module, exports, __dirname, __filename) {
        Ep.VERSION = '0.1.4';
        Ember.libraries && Ember.libraries.register('EPF', Ep.VERSION);
    });
    require.define('/vendor/ember-inflector.js', function (module, exports, __dirname, __filename) {
        (function () {
            Ember.String.pluralize = function (word) {
                return Ember.Inflector.inflector.pluralize(word);
            };
            Ember.String.singularize = function (word) {
                return Ember.Inflector.inflector.singularize(word);
            };
        }());
        (function () {
            var BLANK_REGEX = /^\s*$/;
            function loadUncountable(rules, uncountable) {
                for (var i = 0, length = uncountable.length; i < length; i++) {
                    rules.uncountable[uncountable[i]] = true;
                }
            }
            function loadIrregular(rules, irregularPairs) {
                var pair;
                for (var i = 0, length = irregularPairs.length; i < length; i++) {
                    pair = irregularPairs[i];
                    rules.irregular[pair[0]] = pair[1];
                    rules.irregularInverse[pair[1]] = pair[0];
                }
            }
            function Inflector(ruleSet) {
                ruleSet = ruleSet || {};
                ruleSet.uncountable = ruleSet.uncountable || {};
                ruleSet.irregularPairs = ruleSet.irregularPairs || {};
                var rules = this.rules = {
                        plurals: ruleSet.plurals || [],
                        singular: ruleSet.singular || [],
                        irregular: {},
                        irregularInverse: {},
                        uncountable: {}
                    };
                loadUncountable(rules, ruleSet.uncountable);
                loadIrregular(rules, ruleSet.irregularPairs);
            }
            Inflector.prototype = {
                plural: function (regex, string) {
                    this.rules.plurals.push([
                        regex,
                        string
                    ]);
                },
                singular: function (regex, string) {
                    this.rules.singular.push([
                        regex,
                        string
                    ]);
                },
                uncountable: function (string) {
                    loadUncountable(this.rules, [string]);
                },
                irregular: function (singular, plural) {
                    loadIrregular(this.rules, [[
                            singular,
                            plural
                        ]]);
                },
                pluralize: function (word) {
                    return this.inflect(word, this.rules.plurals);
                },
                singularize: function (word) {
                    return this.inflect(word, this.rules.singular);
                },
                inflect: function (word, typeRules) {
                    var inflection, substitution, result, lowercase, isBlank, isUncountable, isIrregular, isIrregularInverse, rule;
                    isBlank = BLANK_REGEX.test(word);
                    if (isBlank) {
                        return word;
                    }
                    lowercase = word.toLowerCase();
                    isUncountable = this.rules.uncountable[lowercase];
                    if (isUncountable) {
                        return word;
                    }
                    isIrregular = this.rules.irregular[lowercase];
                    if (isIrregular) {
                        return isIrregular;
                    }
                    isIrregularInverse = this.rules.irregularInverse[lowercase];
                    if (isIrregularInverse) {
                        return isIrregularInverse;
                    }
                    for (var i = typeRules.length, min = 0; i > min; i--) {
                        inflection = typeRules[i - 1];
                        rule = inflection[0];
                        if (rule.test(word)) {
                            break;
                        }
                    }
                    inflection = inflection || [];
                    rule = inflection[0];
                    substitution = inflection[1];
                    result = word.replace(rule, substitution);
                    return result;
                }
            };
            Ember.Inflector = Inflector;
        }());
        (function () {
            Ember.Inflector.defaultRules = {
                plurals: [
                    [
                        /$/,
                        's'
                    ],
                    [
                        /s$/i,
                        's'
                    ],
                    [
                        /^(ax|test)is$/i,
                        '$1es'
                    ],
                    [
                        /(octop|vir)us$/i,
                        '$1i'
                    ],
                    [
                        /(octop|vir)i$/i,
                        '$1i'
                    ],
                    [
                        /(alias|status)$/i,
                        '$1es'
                    ],
                    [
                        /(bu)s$/i,
                        '$1ses'
                    ],
                    [
                        /(buffal|tomat)o$/i,
                        '$1oes'
                    ],
                    [
                        /([ti])um$/i,
                        '$1a'
                    ],
                    [
                        /([ti])a$/i,
                        '$1a'
                    ],
                    [
                        /sis$/i,
                        'ses'
                    ],
                    [
                        /(?:([^f])fe|([lr])f)$/i,
                        '$1$2ves'
                    ],
                    [
                        /(hive)$/i,
                        '$1s'
                    ],
                    [
                        /([^aeiouy]|qu)y$/i,
                        '$1ies'
                    ],
                    [
                        /(x|ch|ss|sh)$/i,
                        '$1es'
                    ],
                    [
                        /(matr|vert|ind)(?:ix|ex)$/i,
                        '$1ices'
                    ],
                    [
                        /^(m|l)ouse$/i,
                        '$1ice'
                    ],
                    [
                        /^(m|l)ice$/i,
                        '$1ice'
                    ],
                    [
                        /^(ox)$/i,
                        '$1en'
                    ],
                    [
                        /^(oxen)$/i,
                        '$1'
                    ],
                    [
                        /(quiz)$/i,
                        '$1zes'
                    ]
                ],
                singular: [
                    [
                        /s$/i,
                        ''
                    ],
                    [
                        /(ss)$/i,
                        '$1'
                    ],
                    [
                        /(n)ews$/i,
                        '$1ews'
                    ],
                    [
                        /([ti])a$/i,
                        '$1um'
                    ],
                    [
                        /((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)(sis|ses)$/i,
                        '$1sis'
                    ],
                    [
                        /(^analy)(sis|ses)$/i,
                        '$1sis'
                    ],
                    [
                        /([^f])ves$/i,
                        '$1fe'
                    ],
                    [
                        /(hive)s$/i,
                        '$1'
                    ],
                    [
                        /(tive)s$/i,
                        '$1'
                    ],
                    [
                        /([lr])ves$/i,
                        '$1f'
                    ],
                    [
                        /([^aeiouy]|qu)ies$/i,
                        '$1y'
                    ],
                    [
                        /(s)eries$/i,
                        '$1eries'
                    ],
                    [
                        /(m)ovies$/i,
                        '$1ovie'
                    ],
                    [
                        /(x|ch|ss|sh)es$/i,
                        '$1'
                    ],
                    [
                        /^(m|l)ice$/i,
                        '$1ouse'
                    ],
                    [
                        /(bus)(es)?$/i,
                        '$1'
                    ],
                    [
                        /(o)es$/i,
                        '$1'
                    ],
                    [
                        /(shoe)s$/i,
                        '$1'
                    ],
                    [
                        /(cris|test)(is|es)$/i,
                        '$1is'
                    ],
                    [
                        /^(a)x[ie]s$/i,
                        '$1xis'
                    ],
                    [
                        /(octop|vir)(us|i)$/i,
                        '$1us'
                    ],
                    [
                        /(alias|status)(es)?$/i,
                        '$1'
                    ],
                    [
                        /^(ox)en/i,
                        '$1'
                    ],
                    [
                        /(vert|ind)ices$/i,
                        '$1ex'
                    ],
                    [
                        /(matr)ices$/i,
                        '$1ix'
                    ],
                    [
                        /(quiz)zes$/i,
                        '$1'
                    ],
                    [
                        /(database)s$/i,
                        '$1'
                    ]
                ],
                irregularPairs: [
                    [
                        'person',
                        'people'
                    ],
                    [
                        'man',
                        'men'
                    ],
                    [
                        'child',
                        'children'
                    ],
                    [
                        'sex',
                        'sexes'
                    ],
                    [
                        'move',
                        'moves'
                    ],
                    [
                        'cow',
                        'kine'
                    ],
                    [
                        'zombie',
                        'zombies'
                    ]
                ],
                uncountable: [
                    'equipment',
                    'information',
                    'rice',
                    'money',
                    'species',
                    'series',
                    'fish',
                    'sheep',
                    'jeans',
                    'police'
                ]
            };
        }());
        (function () {
            if (Ember.EXTEND_PROTOTYPES) {
                String.prototype.pluralize = function () {
                    return Ember.String.pluralize(this);
                };
                String.prototype.singularize = function () {
                    return Ember.String.singularize(this);
                };
            }
        }());
        (function () {
            Ember.Inflector.inflector = new Ember.Inflector(Ember.Inflector.defaultRules);
        }());
        (function () {
        }());
    });
    global.epf = require('/lib/index.js');
}.call(this, this));
/*
//@ sourceMappingURL=epf.js.map
*/