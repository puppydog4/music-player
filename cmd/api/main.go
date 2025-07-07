package main

import (
	"log"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/puppydog4/music-player/internal/api/handler"
	"github.com/puppydog4/music-player/internal/service"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	prowlarrService := service.NewProwlarrService()

	router := gin.Default()

	router.GET("/api/v1/search", handler.MusicSearchHandler(prowlarrService))
	router.Static("/static", "./web/static")
	router.GET("/", func(c *gin.Context) {
		c.File(filepath.Join("./web/static", "index.html"))
	})

	router.Run()

}
