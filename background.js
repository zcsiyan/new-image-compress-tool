document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    // 配置
    const config = {
        dataLines: 50,           // 数据线数量
        speed: 2,               // 移动速度
        lineWidth: 2,           // 线条宽度
        fontSize: 12,           // 字体大小
        textSpeed: 0.5,         // 文字移动速度
        baseColor: '#0a192f',   // 背景基础色
        glowColor: '#64ffda',   // 发光色
        textColor: '#64ffda'    // 文字颜色
    };

    // 数据线类
    class DataLine {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = -100;
            this.length = Math.random() * 50 + 20;
            this.speed = Math.random() * config.speed + 1;
            this.text = Math.random().toString(36).substring(2, 4);
            this.textY = this.y;
            this.opacity = Math.random() * 0.5 + 0.5;
        }

        update() {
            this.y += this.speed;
            this.textY += config.textSpeed;

            if (this.y > height + 100) {
                this.reset();
            }
        }

        draw() {
            // 绘制发光线条
            ctx.beginPath();
            ctx.strokeStyle = config.glowColor;
            ctx.lineWidth = config.lineWidth;
            ctx.globalAlpha = this.opacity * 0.5;
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.length);
            ctx.stroke();

            // 绘制文字
            ctx.font = `${config.fontSize}px monospace`;
            ctx.fillStyle = config.textColor;
            ctx.globalAlpha = this.opacity;
            ctx.fillText(this.text, this.x - 8, this.textY);
        }
    }

    let dataLines = [];

    // 初始化数据线
    function init() {
        dataLines = [];
        for (let i = 0; i < config.dataLines; i++) {
            dataLines.push(new DataLine());
        }
    }

    // 创建渐变背景
    function createGradient() {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0a192f');    // 深蓝色
        gradient.addColorStop(0.5, '#172a45');   // 中等蓝色
        gradient.addColorStop(1, '#1f4068');     // 稍亮的蓝色
        return gradient;
    }

    // 添加网格效果
    function drawGrid() {
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.1)';
        ctx.lineWidth = 0.5;
        
        // 绘制垂直线
        for (let x = 0; x < width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y < height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    // 动画循环
    function animate() {
        ctx.globalAlpha = 1;
        ctx.fillStyle = createGradient();
        ctx.fillRect(0, 0, width, height);

        // 绘制网格
        drawGrid();

        // 更新和绘制数据线
        dataLines.forEach(line => {
            line.update();
            line.draw();
        });

        // 添加整体发光效果
        ctx.fillStyle = 'rgba(100, 255, 218, 0.03)';
        ctx.fillRect(0, 0, width, height);

        requestAnimationFrame(animate);
    }

    // 窗口大小改变时重置画布
    window.addEventListener('resize', function() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        init();
    });

    // 启动动画
    init();
    animate();
}); 