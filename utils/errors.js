class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class MissingFieldError extends Error {
  constructor(message) {
    super(message);
    this.name = "MissingFieldError";
    this.statusCode = 400;
  }
}

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = 400;
  }
}

class AlreadyExistsError extends Error {
  constructor(message) {
    super(message);
    this.name = "AlreadyExistsError";
    this.statusCode = 409; // 409 Conflict
  }
}

class AlreadyReportedError extends Error {
  constructor(message) {
    super(message);
    this.name = "AlreadyReportedError";
    this.statusCode = 208; 
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401; // 401 Unauthorized
  }
}
class InvalidError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401; // 401 Unauthorized
  }
}
class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = "ForbiddenError";
    this.statusCode = 403; // 401 Unauthorized
  }
}

export {
  NotFoundError,
  BadRequestError,
  AlreadyExistsError,
  UnauthorizedError,
  ForbiddenError,
  MissingFieldError,
  AlreadyReportedError,
  InvalidError
};
