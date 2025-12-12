import React from 'react';

// الأيقونة الافتراضية (أيقونة التشغيل/Play Icon)
const DefaultIconSvg = () => (
  <svg fill="none" height="33" viewBox="0 0 120 120" width="33" xmlns="http://www.w3.org/2000/svg">
    <path d="m120 60c0 33.1371-26.8629 60-60 60s-60-26.8629-60-60 26.8629-60 60-60 60 26.8629 60 60z" fill="#cd201f"></path>
    <path d="m25 49c0-7.732 6.268-14 14-14h42c7.732 0 14 6.268 14 14v22c0 7.732-6.268 14-14 14h-42c-7.732 0-14-6.268-14-14z" fill="#fff"></path>
    <path d="m74 59.5-21 10.8253v-21.6506z" fill="#cd201f"></path>
  </svg>
);

const AnimatedTutorialButton = ({ 
  onClick, 
  text1 = "شرح الميزة", 
  text2 = "شاهد", 
  Icon = DefaultIconSvg 
}) => {

  return (
    // Button Container: تطبيق الأنماط الأساسية والـ hover
    <button 
      onClick={onClick} 
      className="
        tutorial-button 
        border-1 border-[#cd201f] 
        overflow-hidden 
        relative 
        h-[35px] w-[130px] 
        rounded-[30px] 
        bg-white 
     
      "
    >
      {/* Icon: يتحول لليمين ليختفي */}
      <span 
        className="
         icon
        "
      >
        <Icon />
      </span>

      {/* Text 1: النص الافتراضي، يتحول إلى اليسار ليختفي */}
      <span 
        className="
        text1
        "
      >
        {text1}
      </span>

      {/* Text 2: النص الجديد، يظهر في المنتصف بعد التحول */}
      <span 
        className="
    text2
        "
      >
        {text2}
      </span>
    </button>
  );
};

export default AnimatedTutorialButton;