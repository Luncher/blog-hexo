---
title: linux输入设备抽象
date: 2013-10-21 15:09:57
tags: linux
categories: server
---

最近在些GUI程序，之前也写过一些。长久以来一直对其中一些问题有些好奇，如：鼠标事件和键盘事件是如何获取如何引入程序的，GUI底层绘制操作又是怎么实现的。最近花了点事件学习了下其底层的实现，在这里做个笔记。

<!-- more -->

    LINUX下输入设备放在/dev/input/下，我的电脑该目录内容为：

```shell

lc@lc-Lenovo:~/work/sources$ cd /dev/input/
lc@lc-Lenovo:/dev/input$ ls
by-id    event0  event10  event3  event5  event7  event9  mouse0
by-path  event1  event2   event4  event6  event8  mice

```

    这么多设备我们需要知道哪个设备对应鼠标哪个对应键盘，可以查看文件/proc/bus/input/devices，我的电脑下该文件鼠标和键盘相关信息为：

```shell  
I: Bus=0011 Vendor=0001 Product=0001 Version=ab41
N: Name="AT Translated Set 2 keyboard"
P: Phys=isa0060/serio0/input0
S: Sysfs=/devices/platform/i8042/serio0/input/input2
U: Uniq=
H: Handlers=sysrq kbd event2 
B: PROP=0
B: EV=120013
B: KEY=4 2000000 3803078 f800d001 feffffdf ffefffff ffffffff fffffffe
B: MSC=10
B: LED=7

I: Bus=0003 Vendor=17ef Product=6019 Version=0111
N: Name="Logitech Lenovo USB Optical Mouse"
P: Phys=usb-0000:00:1d.0-1.4/input0
S: Sysfs=/devices/pci0000:00/0000:00:1d.0/usb2/2-1/2-1.4/2-1.4:1.0/input/input3
U: Uniq=
H: Handlers=mouse0 event3 
B: PROP=0
B: EV=17
B: KEY=70000 0 0 0 0 0 0 0 0
B: REL=103
B: MSC=10
```

可以看到鼠标对应的是event3键盘对应的是event2。

    LINUX下每个设备都有一个ID，如果想监视一个设备的行为需要获取该设备句柄，然后交给SELECT或则epoll即可，对于输入设备也是一样。当SELECT循环检测到输入设备有数据可以读取的时候，调用相关接口获取输入设备信息再进一步分发判断具体的事件类型即可。LINUX下相关的数据结构为：

```shell
struct input_event 
{
    struct timeval time;  	        //事件发生的时间
    __u16 type; 			//事件类型
    __u16 code; 			//事件的代码
    __s32 value;			//事件附带值
};
```

该结构体定义在linux/input.h文件下。time表示事件发生的时间戳，type标识事件类型，主要的事件类型有：

```c
 /*
  * Event types
  */
 
 #define EV_SYN                  0x00
 #define EV_KEY                  0x01	//键盘事件
 #define EV_REL                  0x02	//相对坐标
 #define EV_ABS                  0x03	//绝对坐标
 #define EV_MSC                  0x04
 #define EV_SW                   0x05
 #define EV_LED                  0x11
 #define EV_SND                  0x12
 #define EV_REP                  0x14
 #define EV_FF                   0x15
 #define EV_PWR                  0x16
 #define EV_FF_STATUS            0x17
 #define EV_MAX                  0x1f
 #define EV_CNT                  (EV_MAX+1)
```

当type等于EV_KEY时，code的值为KEY_0,1,2...键盘上的按键，比较特殊的是，鼠标左键右键中间按下时键值分别为：BTN_LEFT/BTN_RIGHT/BTN_MIDDLE。EV_ABS表示绝对坐标事件，主要用于标识触摸屏下的用户触摸(touch)事件。此时事件代码code的值可能有ABS_X和ABS_Y两个，分别表示X轴坐标和Y轴坐标。如果事件的类型代码是EV_REL,code值表示轨迹的类型.如指示鼠标的X轴方向REL_X(代码为0x00),指示鼠标的Y轴方向REL_Y(代码为0x01),指示鼠标中轮子方向REL_WHEEL(代码为0x08）等。EV_SYN用于分割事件的一个标记，比如，鼠标按下会受到一个EV_KEY事件，紧接着就是一个EV_SYN事件，鼠标提起的时候也类似。

输入事件分发示例代码：

```c
static RET_E source_input_dispatch(EVENT_SOURCE_T* pstThiz)
{
	int nRet = 0;
	DECL_PRIV(pstThiz, priv);
	struct input_event ievent;
	static int nCount = 0;

	nRet = read(priv->fd, &ievent, sizeof(ievent));
	if(nRet != sizeof(ievent))
	{

		return;
	}	
	switch(ievent.type)
	{
		case EV_KEY:
		{
			if(ievent.code == BTN_LEFT)
			{
				printf("EV_KEY BTN_LEFT click\n");
			}
			else if(ievent.code == BTN_RIGHT)
			{
				printf("EV_KEY BTN_RIGHT click\n");
			}
			else if(ievent.code == BTN_MIDDLE)
			{
				printf("EV_KEY BTN_MIDDLE click\n");
			}
			else if(ievent.code == BTN_TOUCH)
			{
				printf("EV_KEY BTN_TOUCH click\n");
			}

			if(ievent.code == BTN_LEFT || ievent.code == BTN_RIGHT
				|| ievent.code == BTN_MIDDLE || ievent.code == BTN_TOUCH)
			{
				priv->stEvent.eType = ievent.value ? EVT_MOUSE_DOWN : EVT_MOUSE_UP;
			}
			else
			{
				priv->stEvent.eType = ievent.value ? EVT_KEY_DOWN : EVT_KEY_UP;
				priv->stEvent.u.key.nCode = key_map(pstThiz, ievent.code);
				printf("EVENT key code :%d\n", priv->stEvent.u.key.nCode);
			}
			break;
		}
		case EV_ABS:
		{
			switch(ievent.code)
			{
				case ABS_X:
				{
					printf("EV_ABS ABS_X value :%d\n", priv->x);
					priv->x = ievent.value;
					break;
				}
				case ABS_Y:
				{
					printf("EV_ABS ABS_Y value :%d\n", priv->y);
					priv->y = ievent.value;
					break;
				}
				default:
				{
					break;
				}
			}
			if(priv->stEvent.eType == EVT_NOP)
			{
				
				printf("EV_ABS mouse move \n");
				priv->stEvent.eType = EVT_MOUSE_MOVE;
			}
			break;
		}
		case EV_REL:
		{
			switch(ievent.code)
			{
				case REL_X:
				{
					priv->x += ievent.value;
					printf("EV_REL REL_X value :%d\n", priv->x);
					break;
				}
				case REL_Y:
				{
					priv->y += ievent.value;
					printf("EV_REL REL_X value :%d\n", priv->y);
					break;
				}
				default:break;
			}
			if(priv->stEvent.eType == EVT_NOP)
			{
				priv->stEvent.eType = EVT_MOUSE_MOVE;
				printf("EV_REL mouse move\n");
			}
			break;
		}
		case EV_SYN:
		{
			if(priv->stEvent.eType == EVT_MOUSE_DOWN)
			{
				printf("EV_SYN mouse down\n");
			}
			else if(priv->stEvent.eType == EVT_MOUSE_UP)
			{	
				printf("EV_SYN mouse up\n");
			}
			else if(priv->stEvent.eType == EVT_MOUSE_MOVE)
			{	
				printf("EV_SYN mouse move\n");
			}
			break;
		}
		default:break;
	}
	return (RET_OK);
}
```

鼠标左键按下提起事件捕获：

![mouse](/images/linux-mouse.png)

其他事件效果也是类似。