package authorization

import (
	"context"
	"crypto/rsa"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type ContextKey string

const Key = ContextKey("user")

type TokenPayload struct {
	ID    string
	Name  string
	Email string
	Roles []string
	Exp   int64 // Unix timestamp
}

func MiddlwareJWT(publicKey *rsa.PublicKey) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from header
		headerToken := c.GetHeader("Authorization")
		var tokenString string
		_, err := fmt.Sscanf(headerToken, "Bearer %s", &tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		// Parse token
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
			return publicKey, nil
		})
		// error handling
		if err != nil || !token.Valid || isExpiredToken(claims) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		user := TokenPayload{
			ID:    claims["sub"].(string),
			Name:  claims["name"].(string),
			Email: claims["email"].(string),
			Exp:   int64(claims["exp"].(float64)),
		}

		if realmAccess, ok := claims["realm_access"].(map[string]any); ok {
			if roles, ok := realmAccess["roles"].([]any); ok {
				user.Roles = convertInterfaceSliceToStringSlice(roles)
			}
		}

		// Set context
		c.Set(string(Key), user)

		// Next
		c.Next()
	}
}

func convertInterfaceSliceToStringSlice(slice interface{}) []string {
	s := slice.([]interface{})
	result := make([]string, len(s))
	for i, v := range s {
		result[i] = v.(string)
	}
	return result
}

func FromContext(ctx context.Context) (*TokenPayload, error) {
	payload, ok := ctx.Value(string(Key)).(TokenPayload)
	if !ok {
		return nil, fmt.Errorf("user not found")
	}
	return &payload, nil
}

func isExpiredToken(claims jwt.MapClaims) bool {
	exp, ok := claims["exp"].(int64)
	if !ok {
		return false
	}
	return exp <= time.Now().Unix()
}
