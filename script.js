document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded triggered'); 

    var typed = new Typed('#typewriter', {
        strings: ["Union of Soviet Socialist Republics"],
        typeSpeed: 100,
        showCursor: false
    });

    const volumeToggle = document.querySelector('.volume-toggle');
    const volumeControl = document.querySelector('.volume-control');
    const audio = document.getElementById('background-music');
    const volumeSlider = document.getElementById('volume');
    const introOverlay = document.getElementById('intro-overlay');
    const continueText = document.getElementById('continue-text');

    if (!volumeToggle || !volumeControl || !audio || !volumeSlider || !introOverlay || !continueText) {
        console.error('Một hoặc nhiều phần tử không được tìm thấy!');
        return;
    }

    audio.volume = volumeSlider.value;
    audio.muted = false;

    document.body.classList.add('overlay-active');

    introOverlay.addEventListener('click', function() {
        introOverlay.classList.add('zoom-out');
        setTimeout(() => {
            introOverlay.style.display = 'none';
            document.body.classList.remove('overlay-active');
            introOverlay.style.pointerEvents = 'none'; 
        }, 500);
        audio.play().then(() => {
            console.log('Phát nhạc thành công');
        }).catch(error => {
            console.error('Lỗi phát nhạc:', error);
        });
    });

    volumeToggle.addEventListener('click', function() {
        audio.muted = !audio.muted;
        if (audio.muted) {
            volumeToggle.classList.remove('unmute');
            volumeToggle.classList.add('mute');
        } else {
            volumeToggle.classList.remove('mute');
            volumeToggle.classList.add('unmute');
        }
        volumeToggle.classList.add('pulse');
        setTimeout(() => {
            volumeToggle.classList.remove('pulse');
        }, 300);
    });

    volumeSlider.addEventListener('input', function() {
        audio.volume = this.value;
        if (audio.muted && this.value > 0) {
            audio.muted = false;
            volumeToggle.classList.remove('mute');
            volumeToggle.classList.add('unmute');
        }
    });

    let viewCount = 124;
    try {
        viewCount = parseInt(localStorage.getItem('pageViews')) || 124;
        if (!localStorage.getItem('viewCounted')) {
            viewCount++;
            localStorage.setItem('pageViews', viewCount);
            localStorage.setItem('viewCounted', 'true');
        }
    } catch (error) {
        console.error('Lỗi khi truy cập localStorage:', error.message);
        viewCount = 124; 
    }
    document.getElementById('view-count').textContent = viewCount;

    const discordId = '991581569917657178';
    const discordLink = 'https://discord.com/users/991581569917657178';
    const defaultGameAvatar = 'https://i.imgur.com/game-avatar.png'; 

    let lastActivityHash = '';
    let lastStatus = '';
    let currentActivity = null;
    let intervalId = null;
    let isFirstFetch = true;

    function createActivityHash(activity) {
        if (!activity) return '';
        return `${activity.name || ''}-${activity.details || ''}-${activity.application_id || ''}-${activity.assets?.large_image || ''}`;
    }

    function calculateTimeSpent(startTime) {
        const now = Date.now();
        const diffMs = now - startTime;
        const diffSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;

        if (hours > 0) {
            return `${hours} giờ ${minutes} phút ${seconds} giây`;
        } else if (minutes > 0) {
            return `${minutes} phút ${seconds} giây`;
        } else {
            return `${seconds} giây`;
        }
    }

    function updateTimePlayed() {
        const timePlayedValueElement = document.getElementById('time-played-value');
        if (currentActivity && currentActivity.timestamps && currentActivity.timestamps.start && timePlayedValueElement) {
            const timePlayed = calculateTimeSpent(currentActivity.timestamps.start);
            timePlayedValueElement.textContent = timePlayed;
        }
    }

    async function fetchPresence() {
        try {
            console.log('Bắt đầu fetchPresence');
            const response = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
            if (!response.ok) {
                throw new Error(`Lỗi HTTP! Trạng thái: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();
            const statusElement = document.getElementById('discord-status');

            if (!statusElement) {
                console.error('Phần tử discord-status không tồn tại trong HTML!');
                return;
            }

            console.log('Dữ liệu từ Lanyard API:', data);

            if (data.success) {
                console.log('API trả về success');
                const status = data.data.discord_status || 'offline';
                const activities = data.data.activities || [];
                const user = data.data.discord_user || {};

                currentActivity = activities.length > 0 && activities[0].type === 0 ? activities[0] : null;
                const currentActivityHash = createActivityHash(currentActivity);

                console.log('currentActivityHash:', currentActivityHash);
                console.log('lastActivityHash:', lastActivityHash);
                console.log('currentStatus:', status);
                console.log('lastStatus:', lastStatus);

                if (isFirstFetch || status !== lastStatus || currentActivityHash !== lastActivityHash) {
                    console.log('Cập nhật giao diện vì trạng thái hoặc hoạt động thay đổi');
                    isFirstFetch = false;
                    lastActivityHash = currentActivityHash;
                    lastStatus = status;

                    if (intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                    }

                    let statusColor = status === 'online' ? '#43b581' : status === 'idle' ? '#faa61a' : status === 'dnd' ? '#f04747' : '#f04747';
                    let statusTextColor = status === 'online' ? '#43b581' : status === 'idle' ? '#faa61a' : status === 'dnd' ? '#f04747' : '#f04747';

                    let output = '';

                    const avatarUrl = user.avatar 
                        ? `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.png` 
                        : defaultGameAvatar;
                    output += `
                        <div class="discord-avatar">
                            <a href="${discordLink}" target="_blank">
                                <img src="${avatarUrl}" alt="Discord Avatar">
                            </a>
                            <span class="status-circle" style="background-color: ${statusColor};"></span>
                        </div>`;

                    output += `<div class="status-text">`;
                    output += `<span class="status-prefix">Discord Status: </span>`;
                    if (status === 'offline') {
                        output += `<span class="status-label offline">Offline</span>`;
                    } else {
                        output += `<span class="status-label" style="color: ${statusTextColor};">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
                    }

                    if (status !== 'offline' && activities.length > 0 && activities[0].type === 0) {
                        const activity = activities[0];
                        const details = activity.details || '';
                        const state = activity.state || '';
                        const gameInfo = [activity.name, details, state].filter(Boolean).join(' - ');

                        output += `<p>Đang chơi: ${gameInfo}</p>`;
                        if (activity.timestamps && activity.timestamps.start) {
                            const timePlayed = calculateTimeSpent(activity.timestamps.start);
                            output += `<p id="time-played">Thời gian chơi: <span id="time-played-value">${timePlayed}</span></p>`;
                            intervalId = setInterval(updateTimePlayed, 1000);
                        }
                    } else if (status !== 'offline') {
                        output += `<p>Không Có Hoạt Động Nào </p>`;
                    }
                    output += `</div>`;

                    if (status !== 'offline' && activities.length > 0 && activities[0].type === 0) {
                        let gameAvatarUrl = defaultGameAvatar;
                        const activity = activities[0];
                        if (activity.assets && activity.assets.large_image) {
                            const imageId = activity.assets.large_image;
                            if (!imageId.startsWith('mp:external/') && imageId.match(/^[0-9]+$/)) {
                                gameAvatarUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${imageId}.png`;
                            } else if (imageId.startsWith('mp:external/')) {
                                const urlMatch = imageId.match(/mp:external\/[^\/]+\/(.+)/);
                                if (urlMatch && urlMatch[1]) {
                                    let extractedUrl = decodeURI(urlMatch[1]).trim();
                                    if (extractedUrl.startsWith('https/')) {
                                        extractedUrl = extractedUrl.replace(/^https\//, 'https://');
                                    } else if (!extractedUrl.startsWith('http://') && !extractedUrl.startsWith('https://')) {
                                        extractedUrl = 'https://' + extractedUrl;
                                    }
                                    extractedUrl = extractedUrl.replace(/^https:\/\/https:\/\//, 'https://');
                                    gameAvatarUrl = extractedUrl;
                                }
                            }
                        }
                        output += `
                            <div class="game-avatar">
                                <img src="${gameAvatarUrl}" alt="Game Avatar">
                            </div>`;
                    }

                    console.log('Nội dung sẽ hiển thị:', output);
                    statusElement.innerHTML = output;
                    console.log('Nội dung sau khi gán:', statusElement.innerHTML);
                } else {
                    console.log('Không cập nhật giao diện vì không có thay đổi');
                }
            } else {
                console.log('API trả về không thành công');
                statusElement.innerHTML = 'Không tìm thấy dữ liệu. Bạn đã tham gia server Lanyard chưa?';
            }
            setTimeout(fetchPresence, 5000);
        } catch (error) {
            console.error('Lỗi kết nối Lanyard:', error.message);
            if (statusElement) {
                statusElement.innerHTML = 'Lỗi kết nối Lanyard: ' + error.message;
            }
            setTimeout(fetchPresence, 5000);
        }
    }

    fetchPresence();
});
