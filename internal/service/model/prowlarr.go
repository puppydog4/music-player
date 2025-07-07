package model

import "time"

type ProwlarrCategory struct {
	ID            int                `json:"id"`
	Name          string             `json:"name"`
	SubCategories []ProwlarrCategory `json:"subCategories"`
}

// ProwlarrSearchResult represents a single item returned by Prowlarr's search API.
type ProwlarrSearchResult struct {
	ID               int                `json:"id"`
	GUID             string             `json:"guid"`
	Age              int                `json:"age"` // Days
	AgeHours         float64            `json:"ageHours"`
	AgeMinutes       float64            `json:"ageMinutes"`
	Size             int64              `json:"size"` // Size in bytes
	Files            int                `json:"files"`
	Grabs            int                `json:"grabs"`
	IndexerID        int                `json:"indexerId"`
	Indexer          string             `json:"indexer"`
	SubGroup         string             `json:"subGroup"`
	ReleaseHash      string             `json:"releaseHash"`
	Title            string             `json:"title"`
	SortTitle        string             `json:"sortTitle"`
	ImdbID           int                `json:"imdbId"`   // Assuming int, could be string if "tt12345"
	TmdbID           int                `json:"tmdbId"`   // Assuming int
	TvdbID           int                `json:"tvdbId"`   // Assuming int
	TvMazeID         int                `json:"tvMazeId"` // Assuming int
	PublishDate      time.Time          `json:"publishDate"`
	CommentURL       string             `json:"commentUrl"`
	DownloadURL      string             `json:"downloadUrl"`
	InfoURL          string             `json:"infoUrl"`
	PosterURL        string             `json:"posterUrl"`
	IndexerFlags     []string           `json:"indexerFlags"`
	Categories       []ProwlarrCategory `json:"categories"`
	MagnetURL        string             `json:"magnetUrl"`
	InfoHash         string             `json:"infoHash"`
	Seeders          int                `json:"seeders"`
	Leechers         int                `json:"leechers"`
	Protocol         string             `json:"protocol"` // "unknown", "torrent", "usenet"
	FileName         string             `json:"fileName"`
	DownloadClientID int                `json:"downloadClientId"`
}
