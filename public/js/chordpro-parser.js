// Comprehensive ChordPro Parser - No external dependencies needed!
// Supports ChordPro v6 specification with extensive directive support

function parseChordPro(input) {
    if (!input || !input.trim()) {
        return '<p style="color: #94a3b8; text-align: center;">A pré-visualização aparecerá aqui...</p>';
    }

    const lines = input.split('\n');
    let html = '<div class="chordpro-song" style="font-family: \'Courier New\', monospace; line-height: 2; max-width: 800px;">';
    
    // Song metadata
    const metadata = {
        title: null,
        subtitle: [],
        artist: [],
        composer: [],
        lyricist: [],
        arranger: [],
        copyright: [],
        album: null,
        year: null,
        key: null,
        time: null,
        tempo: null,
        duration: null,
        capo: null
    };
    
    // State tracking
    let inSection = null;
    let sectionLabel = null;
    let inTab = false;
    let inGrid = false;
    let currentStyles = {
        chordColor: '#2563eb',
        chordSize: '0.95em',
        textColor: '#1e293b',
        textSize: '1em'
    };

    // First pass: collect metadata
    for (let line of lines) {
        const directive = parseDirective(line.trim());
        if (directive && directive.type === 'meta') {
            updateMetadata(metadata, directive);
        }
    }

    // Render metadata header
    if (metadata.title) {
        html += `<h2 style="margin: 0 0 5px 0; color: #1e293b; font-size: 1.5em;">${escapeHtml(metadata.title)}</h2>`;
    }
    
    if (metadata.subtitle.length > 0) {
        metadata.subtitle.forEach(st => {
            html += `<p style="margin: 0 0 3px 0; color: #64748b; font-size: 1.1em;">${escapeHtml(st)}</p>`;
        });
    }
    
    if (metadata.artist.length > 0) {
        html += `<p style="margin: 0 0 3px 0; color: #64748b; font-style: italic;">Artist: ${escapeHtml(metadata.artist.join(', '))}</p>`;
    }
    
    if (metadata.composer.length > 0) {
        html += `<p style="margin: 0 0 3px 0; color: #64748b; font-size: 0.9em;">Composer: ${escapeHtml(metadata.composer.join(', '))}</p>`;
    }
    
    if (metadata.lyricist.length > 0) {
        html += `<p style="margin: 0 0 3px 0; color: #64748b; font-size: 0.9em;">Lyricist: ${escapeHtml(metadata.lyricist.join(', '))}</p>`;
    }
    
    // Key, Tempo, Capo, Time signature in one line
    let infoLine = [];
    if (metadata.key) infoLine.push(`Key: ${escapeHtml(metadata.key)}`);
    if (metadata.time) infoLine.push(`Time: ${escapeHtml(metadata.time)}`);
    if (metadata.tempo) infoLine.push(`Tempo: ${escapeHtml(metadata.tempo)}`);
    if (metadata.capo) infoLine.push(`Capo: ${escapeHtml(metadata.capo)}`);
    if (metadata.duration) infoLine.push(`Duration: ${escapeHtml(metadata.duration)}`);
    
    if (infoLine.length > 0) {
        html += `<p style="margin: 0 0 10px 0; color: #64748b; font-size: 0.9em;">${infoLine.join(' • ')}</p>`;
    }
    
    if (metadata.album) {
        html += `<p style="margin: 0 0 3px 0; color: #64748b; font-size: 0.9em;">Album: ${escapeHtml(metadata.album)}</p>`;
    }
    
    if (metadata.copyright.length > 0) {
        html += `<p style="margin: 0 0 15px 0; color: #64748b; font-size: 0.85em;">© ${escapeHtml(metadata.copyright.join(' • '))}</p>`;
    } else {
        html += '<div style="height: 15px;"></div>';
    }

    // Second pass: render content
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmed = line.trim();
        
        // Skip comments
        if (trimmed.startsWith('#')) continue;
        
        // Handle line continuation
        if (trimmed.endsWith('\\') && i < lines.length - 1) {
            line = trimmed.slice(0, -1) + lines[i + 1].trimStart();
            i++; // skip next line
        }

        const directive = parseDirective(trimmed);
        
        if (directive) {
            // Handle section directives
            if (directive.type === 'section_start') {
                inSection = directive.section;
                sectionLabel = directive.label;
                html += getSectionStartHTML(directive.section, directive.label);
                if (directive.section === 'tab') inTab = true;
                if (directive.section === 'grid') inGrid = true;
                continue;
            }
            
            if (directive.type === 'section_end') {
                html += getSectionEndHTML(inSection);
                if (inSection === 'tab') inTab = false;
                if (inSection === 'grid') inGrid = false;
                inSection = null;
                sectionLabel = null;
                continue;
            }
            
            // Handle style directives
            if (directive.type === 'style') {
                applyStyle(currentStyles, directive);
                continue;
            }
            
            // Handle comment directives
            if (directive.type === 'comment') {
                html += getCommentHTML(directive.text, directive.variant);
                continue;
            }
            
            // Handle chorus shorthand
            if (directive.type === 'chorus') {
                html += '<div style="margin-left: 20px; border-left: 3px solid #3b82f6; padding-left: 15px; font-style: italic; color: #64748b;">';
                html += '<p style="margin: 5px 0;">[Repeat Chorus]</p>';
                html += '</div>';
                continue;
            }
            
            // Handle column breaks and page breaks
            if (directive.type === 'column_break' || directive.type === 'new_page') {
                html += '<div style="height: 30px; border-top: 2px dashed #cbd5e1; margin: 20px 0;"></div>';
                continue;
            }
            
            // Skip meta directives (already processed)
            if (directive.type === 'meta') continue;
            
            // Skip other control directives
            if (['define', 'chord', 'new_song', 'columns', 'pagetype', 'titles'].includes(directive.type)) {
                continue;
            }
        }

        // Empty line - add spacing
        if (trimmed === '') {
            html += '<div style="height: 15px;"></div>';
            continue;
        }

        // Handle TAB content (preserve formatting)
        if (inTab) {
            html += `<div style="font-family: 'Courier New', monospace; white-space: pre; color: ${currentStyles.textColor}; font-size: ${currentStyles.textSize};">${escapeHtml(line)}</div>`;
            continue;
        }
        
        // Handle grid content
        if (inGrid) {
            html += parseGridLine(line);
            continue;
        }

        // Parse regular lines with chords
        const chordLine = parseLineWithChords(line, currentStyles);
        html += chordLine;
    }
    
    // Close any open sections
    if (inSection) {
        html += getSectionEndHTML(inSection);
    }

    html += '</div>';
    return html;
}

function parseDirective(line) {
    if (!line.startsWith('{') || !line.endsWith('}')) return null;
    
    const content = line.slice(1, -1).trim();
    const colonIndex = content.indexOf(':');
    
    let name, value;
    if (colonIndex === -1) {
        name = content;
        value = '';
    } else {
        name = content.slice(0, colonIndex).trim();
        value = content.slice(colonIndex + 1).trim();
    }
    
    // Handle directive abbreviations
    const directiveMap = {
        't': 'title',
        'st': 'subtitle',
        'su': 'subtitle',
        'c': 'comment',
        'ci': 'comment_italic',
        'cb': 'comment_box',
        'gc': 'guitar_comment',
        'soc': 'start_of_chorus',
        'eoc': 'end_of_chorus',
        'sov': 'start_of_verse',
        'eov': 'end_of_verse',
        'sob': 'start_of_bridge',
        'eob': 'end_of_bridge',
        'sop': 'start_of_part',
        'eop': 'end_of_part',
        'sot': 'start_of_tab',
        'eot': 'end_of_tab',
        'sog': 'start_of_grid',
        'eog': 'end_of_grid',
        'np': 'new_page',
        'npp': 'new_physical_page',
        'ns': 'new_song',
        'colb': 'column_break',
        'cf': 'chordfont',
        'cs': 'chordsize',
        'cc': 'chordcolour',
        'tf': 'textfont',
        'ts': 'textsize',
        'tc': 'textcolour'
    };
    
    const fullName = directiveMap[name] || name;
    
    // Metadata directives
    const metaDirectives = ['title', 'subtitle', 'artist', 'composer', 'lyricist', 'arranger', 
                           'copyright', 'album', 'year', 'key', 'time', 'tempo', 'duration', 'capo', 'meta'];
    if (metaDirectives.includes(fullName)) {
        return { type: 'meta', name: fullName, value };
    }
    
    // Section directives
    if (fullName.startsWith('start_of_')) {
        const section = fullName.replace('start_of_', '');
        return { type: 'section_start', section, label: value };
    }
    if (fullName.startsWith('end_of_')) {
        return { type: 'section_end' };
    }
    
    // Comment directives
    if (['comment', 'comment_italic', 'comment_box', 'guitar_comment'].includes(fullName)) {
        return { type: 'comment', text: value, variant: fullName };
    }
    
    // Chorus shorthand
    if (fullName === 'chorus') {
        return { type: 'chorus' };
    }
    
    // Style directives
    if (['chordfont', 'chordsize', 'chordcolour', 'chordcolor', 
         'textfont', 'textsize', 'textcolour', 'textcolor',
         'tabfont', 'tabsize', 'tabcolour', 'tabcolor'].includes(fullName)) {
        return { type: 'style', name: fullName, value };
    }
    
    // Page/column control
    if (['new_page', 'new_physical_page', 'column_break', 'colb'].includes(fullName)) {
        return { type: fullName.includes('column') ? 'column_break' : 'new_page' };
    }
    
    // Other directives
    return { type: fullName, value };
}

function updateMetadata(metadata, directive) {
    const name = directive.name;
    const value = directive.value;
    
    if (name === 'meta') {
        // Handle generic meta directive
        const metaMatch = value.match(/^(\w+)\s+(.+)$/);
        if (metaMatch) {
            const [, metaName, metaValue] = metaMatch;
            updateMetadata(metadata, { name: metaName, value: metaValue });
        }
        return;
    }
    
    if (name === 'subtitle' || name === 'artist' || name === 'composer' || 
        name === 'lyricist' || name === 'arranger' || name === 'copyright') {
        metadata[name].push(value);
    } else if (metadata.hasOwnProperty(name)) {
        metadata[name] = value;
    }
}

function getSectionStartHTML(section, label) {
    const sectionStyles = {
        chorus: 'margin-left: 20px; border-left: 3px solid #3b82f6; padding-left: 15px;',
        verse: 'margin: 15px 0;',
        bridge: 'margin: 15px 0; border-left: 3px solid #f59e0b; padding-left: 15px;',
        part: 'margin: 15px 0; border-left: 3px solid #8b5cf6; padding-left: 15px;',
        tab: 'background: #f8fafc; padding: 10px; border-radius: 4px; margin: 10px 0;',
        grid: 'background: #f8fafc; padding: 10px; border-radius: 4px; margin: 10px 0; font-family: monospace;'
    };
    
    const style = sectionStyles[section] || 'margin: 15px 0;';
    let html = `<div style="${style}">`;
    
    if (label) {
        const labelText = section.charAt(0).toUpperCase() + section.slice(1) + (label ? ': ' + label : '');
        html += `<p style="font-weight: bold; color: #475569; margin: 0 0 5px 0;">${escapeHtml(labelText)}</p>`;
    }
    
    return html;
}

function getSectionEndHTML(section) {
    return '</div>';
}

function getCommentHTML(text, variant) {
    const styles = {
        comment: 'color: #64748b; font-style: italic; margin: 10px 0; font-weight: 500;',
        comment_italic: 'color: #64748b; font-style: italic; margin: 10px 0;',
        comment_box: 'color: #1e293b; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 4px; margin: 10px 0;',
        guitar_comment: 'color: #059669; font-style: italic; margin: 10px 0; font-size: 0.9em;'
    };
    
    const style = styles[variant] || styles.comment;
    return `<p style="${style}">${escapeHtml(text)}</p>`;
}

function applyStyle(currentStyles, directive) {
    const name = directive.name;
    const value = directive.value;
    
    // Reset to default if empty
    if (!value) {
        if (name.includes('chord')) {
            currentStyles.chordColor = '#2563eb';
            currentStyles.chordSize = '0.95em';
        } else if (name.includes('text')) {
            currentStyles.textColor = '#1e293b';
            currentStyles.textSize = '1em';
        }
        return;
    }
    
    if (name.includes('colour') || name.includes('color')) {
        const color = value.startsWith('#') ? value : value;
        if (name.includes('chord')) currentStyles.chordColor = color;
        else if (name.includes('text')) currentStyles.textColor = color;
    } else if (name.includes('size')) {
        const size = value.includes('%') ? value : value + 'px';
        if (name.includes('chord')) currentStyles.chordSize = size;
        else if (name.includes('text')) currentStyles.textSize = size;
    }
}

function parseLineWithChords(line, styles) {
    const chordRegex = /\[([^\]]+)\]/g;
    let match;
    const chords = [];
    
    // Find all chords and their positions
    while ((match = chordRegex.exec(line)) !== null) {
        chords.push({ 
            chord: match[1], 
            offset: match.index 
        });
    }

    if (chords.length === 0) {
        // No chords, just return the line
        return `<p style="margin: 5px 0; color: ${styles.textColor}; font-size: ${styles.textSize};">${escapeHtml(line)}</p>`;
    }

    // Build HTML with chords above lyrics
    let html = '<div style="position: relative; margin: 10px 0;">';
    
    // Chord line
    html += `<div style="position: relative; height: 20px; color: ${styles.chordColor}; font-weight: bold; font-size: ${styles.chordSize};">`;
    for (let {chord, offset} of chords) {
        const position = offset * 0.6; // approximate character width
        html += `<span style="position: absolute; left: ${position}em;">${escapeHtml(chord)}</span>`;
    }
    html += '</div>';

    // Lyrics line
    const cleanLyrics = line.replace(/\[([^\]]+)\]/g, '');
    html += `<div style="color: ${styles.textColor}; font-size: ${styles.textSize};">${escapeHtml(cleanLyrics)}</div>`;
    html += '</div>';

    return html;
}

function parseGridLine(line) {
    // Simple grid parser - treats | as bar lines and chords as cells
    if (!line.trim()) return '<div style="height: 10px;"></div>';
    
    const cleaned = line.replace(/\|\|/g, '<span style="font-weight: bold;">||</span>')
                       .replace(/\|/g, '<span style="color: #64748b;">|</span>');
    return `<div style="font-family: 'Courier New', monospace; white-space: pre; padding: 2px 0;">${cleaned}</div>`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Replace the updatePreview function in editor.js with this:
function updatePreview() {
    const input = document.getElementById('chordproInput').value;
    const preview = document.getElementById('preview');
    
    try {
        const html = parseChordPro(input);
        preview.innerHTML = html;
    } catch (error) {
        console.error('Parse error:', error);
        preview.innerHTML = `<p style="color: #dc2626;">Erro ao processar ChordPro: ${error.message}</p>`;
    }
}