package customerrors

import "errors"

type CustomError struct {
	Message string
	Err     error
}

func (e *CustomError) Error() string {
	return e.Message
}

func (e *CustomError) Unwrap() error {
	return e.Err
}

func New(message string, err error) *CustomError {
	return &CustomError{
		Message: message,
		Err:     err,
	}
}

var (
	ErrInternal   = errors.New("internal error")
	ErrForbidden  = errors.New("forbidden")
	ErrNotFound   = errors.New("not found")
	ErrConflict   = errors.New("conflict")
	ErrInvalid    = errors.New("invalid")
	ErrBadRequest = errors.New("bad request")
)
