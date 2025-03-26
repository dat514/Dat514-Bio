document.addEventListener('DOMContentLoaded', function() {
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

    let viewCount = parseInt(localStorage.getItem('pageViews')) || 0;
    if (!localStorage.getItem('viewCounted')) {
        viewCount++;
        localStorage.setItem('pageViews', viewCount);
        localStorage.setItem('viewCounted', 'true');
    }
    document.getElementById('view-count').textContent = viewCount;

    const discordId = '991581569917657178';
    const discordLink = 'https://discord.com/users/991581569917657178';
    const defaultGameAvatar = 'https://i.imgur.com/game-avatar.png'; 

    let lastActivityHash = '';
    const loggedErrors = new Set();
    let currentActivity = null;
    let intervalId = null;

    async function isValidImageUrl(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                console.log(`Hình ảnh tải thành công: ${url}`);
                resolve(true);
            };
            img.onerror = () => {
                if (!loggedErrors.has(url)) {
                    console.log(`URL hình ảnh không hợp lệ hoặc không tải được: ${url}`);
                    loggedErrors.add(url);
                }
                resolve(false);
            };
            img.src = url;
        });
    }

    function extractExternalUrl(largeImage) {
        if (largeImage.startsWith('mp:external/')) {
            const urlMatch = largeImage.match(/mp:external\/[^\/]+\/(.+)/);
            if (urlMatch && urlMatch[1]) {
                let extractedUrl = decodeURI(urlMatch[1]).trim();
                console.log('URL được trích xuất từ mp:external:', extractedUrl);
                if (extractedUrl.startsWith('https/')) {
                    extractedUrl = extractedUrl.replace(/^https\//, 'https://');
                } else if (!extractedUrl.startsWith('http://') && !extractedUrl.startsWith('https://')) {
                    extractedUrl = 'https://' + extractedUrl;
                }
                extractedUrl = extractedUrl.replace(/^https:\/\/https:\/\//, 'https://');
                console.log('URL cuối cùng sau khi xử lý:', extractedUrl);
                return extractedUrl;
            } else {
                console.log('Không thể trích xuất URL từ mp:external:', largeImage);
            }
        }
        return null;
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

    function createActivityHash(activity) {
        if (!activity) return '';
        return `${activity.name || ''}-${activity.details || ''}-${activity.application_id || ''}-${activity.assets?.large_image || ''}`;
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
            const response = await fetch(`https://api.lanyard.rest/v1/users/${discordId}`);
            if (!response.ok) {
                throw new Error(`Lỗi HTTP! Trạng thái: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();

            const statusElement = document.getElementById('discord-status');
            if (data.success) {
                const status = data.data.discord_status || 'offline';
                const activities = data.data.activities || [];
                const user = data.data.discord_user || {};

                currentActivity = activities.length > 0 && activities[0].type === 0 ? activities[0] : null;
                const currentActivityHash = createActivityHash(currentActivity);

                if (currentActivityHash === lastActivityHash) {
                    setTimeout(fetchPresence, 5000);
                    return;
                }
                lastActivityHash = currentActivityHash;

                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }

                let statusColor = status === 'online' ? '#43b581' : status === 'idle' ? '#faa61a' : status === 'dnd' ? '#f04747' : '#f04747';
                let statusTextColor = status === 'online' ? '#43b581' : status === 'idle' ? '#faa61a' : status === 'dnd' ? '#f04747' : '#f04747';

                let output = '';

                let discordAvatarHtml = '';
                if (user.avatar) {
                    const avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.png`;
                    const isValidAvatar = await isValidImageUrl(avatarUrl);
                    discordAvatarHtml = `
                        <div class="discord-avatar">
                            <a href="${discordLink}" target="_blank">
                                <img src="${isValidAvatar ? avatarUrl : defaultGameAvatar}" alt="Discord Avatar">
                            </a>
                            <span class="status-circle" style="background-color: ${statusColor};"></span>
                        </div>`;
                } else {
                    console.log('Không tìm thấy avatar Discord');
                }
                output += discordAvatarHtml;

                output += `<div class="status-text">`;
                if (status === 'offline') {
                    output += `<span class="status-label offline" style="color: #f04747;">Offline</span>`;
                } else {
                    output += `<span class="status-label" style="color: ${statusTextColor};">${status}</span>`;
                }

                if (activities.length > 0 && activities[0].type === 0) {
                    const activity = activities[0];
                    const details = activity.details || '';
                    const state = activity.state || '';
                    const gameInfo = [activity.name, details, state].filter(Boolean).join(' - ');

                    console.log('Dữ liệu hoạt động:', activity);
                    output += `<p>Đang chơi: ${gameInfo}</p>`;
                    if (activity.timestamps && activity.timestamps.start) {
                        const timePlayed = calculateTimeSpent(activity.timestamps.start);
                        output += `<p id="time-played">Thời gian chơi: <span id="time-played-value">${timePlayed}</span></p>`;
                        intervalId = setInterval(updateTimePlayed, 1000);
                    }
                } else if (status !== 'offline') {
                    output += `<p>Không Có</p>`;
                }
                output += `</div>`;

                let gameAvatarHtml = '';
                if (activities.length > 0 && activities[0].type === 0) {
                    const activity = activities[0];
                    let avatarUrl = defaultGameAvatar;

                    console.log('Kiểm tra assets của activity:', activity.assets);

                    if (activity.assets && activity.assets.large_image) {
                        const imageId = activity.assets.large_image;
                        console.log('large_image:', imageId);

                        if (!imageId.startsWith('mp:external/') && imageId.match(/^[0-9]+$/)) {
                            const potentialUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${imageId}.png`;
                            console.log('Kiểm tra URL hình ảnh Discord:', potentialUrl);
                            const isValid = await isValidImageUrl(potentialUrl);
                            if (isValid) {
                                avatarUrl = potentialUrl;
                                console.log('URL hình ảnh game (Discord):', avatarUrl);
                            } else {
                                console.log('Hình ảnh Discord không hợp lệ, sử dụng mặc định:', potentialUrl);
                            }
                        } else if (imageId.startsWith('mp:external/')) {
                            const externalUrl = extractExternalUrl(imageId);
                            if (externalUrl) {
                                const isValid = await isValidImageUrl(externalUrl);
                                if (isValid) {
                                    avatarUrl = externalUrl;
                                    console.log('URL hình ảnh game (External):', avatarUrl);
                                } else {
                                    console.log('URL từ mp:external không hợp lệ, sử dụng mặc định:', externalUrl);
                                }
                            } else {
                                console.log('Không thể trích xuất URL từ mp:external:', imageId);
                            }
                        } else {
                            console.log('Bỏ qua large_image không hợp lệ:', imageId);
                        }
                    } else {
                        console.log('Không có assets hoặc large_image để lấy hình ảnh game. Sử dụng hình ảnh mặc định.');
                    }

                    gameAvatarHtml = `
                        <div class="game-avatar">
                            <img src="${avatarUrl}" alt="Game Avatar">
                        </div>`;
                }
                output += gameAvatarHtml;

                statusElement.innerHTML = output;
            } else {
                statusElement.innerHTML = 'Không tìm thấy dữ liệu. Bạn đã tham gia server Lanyard chưa?';
            }
            setTimeout(fetchPresence, 5000);
        } catch (error) {
            console.error('Lỗi kết nối Lanyard:', error.message);
            document.getElementById('discord-status').innerHTML = 'Lỗi kết nối Lanyard: ' + error.message;
            setTimeout(fetchPresence, 5000);
        }
    }

    fetchPresence();
});