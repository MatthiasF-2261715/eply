const cheerio = require('cheerio');

/**
 * Filters HTML content from email and extracts plain text
 * @param {string} htmlContent - The HTML content to filter
 * @returns {string} - Plain text content
 */
function filterHtmlContent(htmlContent) {
    if (!htmlContent) return '';
    
    // Load HTML into cheerio for parsing
    const $ = cheerio.load(htmlContent);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Get text content and clean it up
    let text = $.text();
    
    // Clean up whitespace
    text = text
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();
    
    return text;
}

module.exports = {
    filterHtmlContent
};