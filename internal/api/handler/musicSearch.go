package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/puppydog4/music-player/internal/service"
)

func MusicSearchHandler(prowlarrService *service.ProwlarrService) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := c.Query("q")

		results, err := prowlarrService.SearchProwlarr(query)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, results)
	}
}
