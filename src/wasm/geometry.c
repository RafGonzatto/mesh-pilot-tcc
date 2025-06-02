#include <math.h>
#include <stdbool.h>
#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#endif

static inline double dir(double x1,double y1,double x2,double y2,double x3,double y3){
  return (x2-x1)*(y3-y1)-(y2-y1)*(x3-x1);
}
static inline bool onSeg(double x1,double y1,double x2,double y2,double x3,double y3){
  return x3>=fmin(x1,x2)&&x3<=fmax(x1,x2)&&y3>=fmin(y1,y2)&&y3<=fmax(y1,y2);
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
int segments_intersect(double p1x,double p1y,double p2x,double p2y,
                       double p3x,double p3y,double p4x,double p4y){
  const double EPS=1e-9;
  double d1=dir(p3x,p3y,p4x,p4y,p1x,p1y);
  double d2=dir(p3x,p3y,p4x,p4y,p2x,p2y);
  double d3=dir(p1x,p1y,p2x,p2y,p3x,p3y);
  double d4=dir(p1x,p1y,p2x,p2y,p4x,p4y);

  if(((d1>EPS&&d2<-EPS)||(d1<-EPS&&d2>EPS))&&
     ((d3>EPS&&d4<-EPS)||(d3<-EPS&&d4>EPS))) return 1;

  if(fabs(d1)<EPS&&onSeg(p3x,p3y,p4x,p4y,p1x,p1y)) return 1;
  if(fabs(d2)<EPS&&onSeg(p3x,p3y,p4x,p4y,p2x,p2y)) return 1;
  if(fabs(d3)<EPS&&onSeg(p1x,p1y,p2x,p2y,p3x,p3y)) return 1;
  if(fabs(d4)<EPS&&onSeg(p1x,p1y,p2x,p2y,p4x,p4y)) return 1;
  return 0;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
int bbox_overlap(double axmin,double axmax,double aymin,double aymax,
                 double bxmin,double bxmax,double bymin,double bymax){
  return !(axmax<bxmin||bxmax<axmin||aymax<bymin||bymax<aymin);
}
