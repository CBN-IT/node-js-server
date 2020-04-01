if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            let alt = {};

            Object.getOwnPropertyNames(this).forEach((key) =>{
                alt[key] = this[key];
            });

            return alt;
        },
        configurable: true,
        writable: true
    });
}

class ValidationError extends Error {
    constructor(message) {
        super();
        this.name = 'ValidationError';
        this.message = message
    }
}
class RequiredFieldError extends Error {
    constructor(message) {
        super();
        this.name = 'RequiredFieldError';
        this.message = message
    }
}
class AuthenticationError extends Error {
    constructor(message) {
        super();
        this.name = 'AuthenticationError';
        this.message = message
    }
}
class AuthorizationError extends Error {
    constructor(message) {
        super();
        this.name = 'AuthorizationError';
        this.message = message
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super();
        this.name = 'NotFoundError';
        this.message = message
    }
}
class TimeoutError extends Error {
    constructor(message) {
        super();
        this.name = 'TimeoutError';
        this.message = message
    }
}

module.exports = {
    ValidationError,
    RequiredFieldError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    TimeoutError
};