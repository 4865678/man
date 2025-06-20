/**
 * 哔哩哔哩视频播放器控制脚本
 * 功能：播放控制、进度条拖动、画质切换、微信适配
 */

// 全局变量
const player = document.getElementById('biliIframe');
const playBtn = document.getElementById('playBtn');
const progressBar = document.getElementById('progressBar');
const timeText = document.getElementById('timeText');
const qualityBtn = document.getElementById('qualityBtn');
const titleText = document.getElementById('titleText');

// 检测是否为移动端（微信环境）
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && 
                 /MicroMessenger/i.test(navigator.userAgent);

// 初始化
init();
function init() {
    // 微信端点击屏幕触发播放
    if (isMobile) {
        document.addEventListener('touchstart', handleTouchPlay);
    } else {
        // 桌面端自动播放（需浏览器支持）
        player.src += '&autoplay=1';
    }

    // 监听视频加载完成
    player.addEventListener('load', () => {
        titleText.textContent = '示例视频：青春舞蹈秀'; // 自定义标题
    });

    // 播放/暂停控制
    playBtn.addEventListener('click', togglePlay);

    // 进度条拖动
    progressBar.addEventListener('input', updateProgress);
    progressBar.addEventListener('change', seekVideo);
}

/**
 * 触摸播放处理（微信适配）
 */
function handleTouchPlay() {
    if (isMobile) {
        // 切换为自动播放链接
        player.src = player.src.replace('autoplay=0', 'autoplay=1');
        document.removeEventListener('touchstart', handleTouchPlay);
    }
}

/**
 * 播放/暂停切换
 */
function togglePlay() {
    const isPlaying = player.contentWindow.document.querySelector('.bilibili-player-video-play');
    if (isPlaying) {
        player.contentWindow.postMessage('{"command":"pause"}', '*');
        playBtn.querySelector('.icon').textContent = '▶';
        playBtn.querySelector('.text').textContent = '播放';
    } else {
        player.contentWindow.postMessage('{"command":"play"}', '*');
        playBtn.querySelector('.icon').textContent = '||';
        playBtn.querySelector('.text').textContent = '暂停';
    }
}

/**
 * 更新进度条
 */
function updateProgress() {
    const currentTime = parseFloat(progressBar.value);
    timeText.textContent = formatTime(currentTime) + ' / ' + formatTime(progressBar.max);
}

/**
 * 跳转播放进度
 */
function seekVideo() {
    const seekTime = parseFloat(progressBar.value);
    player.contentWindow.postMessage(`{"command":"seekTo","time":${seekTime}}`, '*');
}

/**
 * 格式化时间（秒转分秒）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间（mm:ss）
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/**
 * 画质切换（需B站支持）
 */
qualityBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const list = qualityBtn.querySelector('.quality-list');
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', () => {
    const list = qualityBtn.querySelector('.quality-list');
    if (list.style.display === 'block') {
        list.style.display = 'none';
    }
});
// script.js 新增代码
async function fetchVideoTitle(bvid) {
    try {
        const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
        const data = await response.json();
        if (data.code === 0) {
            titleText.textContent = data.data.title;
        }
    } catch (error) {
        console.error('获取标题失败:', error);
    }
}

// 初始化时调用
function init() {
    const bvid = new URL(player.src).searchParams.get('bvid');
    fetchVideoTitle(bvid);
    // 原有初始化逻辑...
}
let isDragging = false;

progressBar.addEventListener('mousedown', () => {
    isDragging = true;
    player.contentWindow.postMessage('{"command":"pause"}', '*');
});

progressBar.addEventListener('mouseup', () => {
    isDragging = false;
    player.contentWindow.postMessage('{"command":"play"}', '*');
});

// 实时更新进度（非拖拽状态）
player.contentWindow.addEventListener('message', (e) => {
    if (e.data?.currentTime && !isDragging) {
        progressBar.value = e.data.currentTime;
        timeText.textContent = formatTime(e.data.currentTime) + 
                             ' / ' + formatTime(e.data.duration);
    }
});
qualityBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const list = qualityBtn.querySelector('.quality-list');
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
});

// 点击画质选项
document.querySelectorAll('.quality-list li').forEach(li => {
    li.addEventListener('click', () => {
        const quality = li.dataset.quality;
        let qParam = 'high_quality=';
        switch (quality) {
            case 'super': qParam += '2'; break;
            case '4k': qParam += '3'; break;
            default: qParam += '1';
        }
        player.src = player.src.split('&').filter(param => !param.startsWith('high_quality'))
               .join('&') + `&${qParam}`;
        qualityBtn.textContent = `画质：${quality.toUpperCase()}`;
        list.style.display = 'none';
    });
});