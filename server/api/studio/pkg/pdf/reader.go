package pdf

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
	"unicode/utf8"

	"github.com/ledongthuc/pdf"
)

func ReadPDFFile(filePath string) (string, error) {

	f, r, err := pdf.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("open pdf file error: %v", err)
	}
	defer f.Close()
	texts := make([]pdf.Text, 0)
	fontSizeArr := make(map[float64]bool, 0)
	for j := 1; j <= r.NumPage(); j++ {
		page := r.Page(j)
		if page.V.IsNull() {
			continue
		}
		content := page.Content()
		// read all text with fontSize
		var lastTextStyle pdf.Text
		for _, text := range content.Text {
			if isSameSentence(lastTextStyle, text) {
				// check utf code
				if utf8.ValidString(text.S) {
					lastTextStyle.S += text.S
				}
			} else {
				texts = append(texts, lastTextStyle)
				fontSizeArr[lastTextStyle.FontSize] = true
				lastTextStyle = text
			}
		}
		if lastTextStyle.S != "" {
			texts = append(texts, lastTextStyle)
		}
	}
	// sort fontSize
	fontSizes := make([]float64, 0)
	for fontSize := range fontSizeArr {
		fontSizes = append(fontSizes, fontSize)
	}
	sort.Sort(sort.Reverse(sort.Float64Slice(fontSizes)))
	sortFontSizeMap := make(map[float64]int)
	for index, fontSize := range fontSizes {
		sortFontSizeMap[fontSize] = index + 1
	}

	//read all text with fontSize
	str := ""
	for _, text := range texts {
		text.S = strings.Trim(text.S, " ")
		regex := regexp.MustCompile(`(\n(\n|\s){1,})|\.{6,}`)
		text.S = regex.ReplaceAllString(text.S, "\n")
		text.S = strings.ReplaceAll(text.S, "�", " ")
		text.S = strings.Trim(text.S, " ")
		if len(text.S) == 0 || text.S == " " {
			continue
		}
		fontSize := text.FontSize
		index, ok := sortFontSizeMap[fontSize]
		if !ok {
			index = len(fontSizes) - 1
		}
		if index < 4 {
			str += fmt.Sprintf("<H%v>%s<H%v>\n", index, text.S, index)
		} else {
			str += text.S + "\n"
		}
	}
	return str, nil
}

func isSameSentence(text1 pdf.Text, text2 pdf.Text) bool {
	return text1.FontSize == text2.FontSize && text1.Font == text2.Font
}
