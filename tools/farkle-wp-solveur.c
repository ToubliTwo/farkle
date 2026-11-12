// Farkle ChatDeck : probabilité de victoire exacte. Unités de 50 points, objectif 80 (4000).
// P(i,j,k,n) : proba que le joueur au trait gagne, i = son score, j = adversaire, k = points en jeu, n = dés à lancer.
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#define G 80
typedef struct { int pts, used; } Opt;
typedef struct { double p; int no; Opt o[8]; } Roll;
static Roll R[7][500]; static int NR[7];
static int best(int *c){ // meilleur score (unités) en utilisant TOUS les dés de c, -1 sinon
  int tot=0; for(int f=1;f<=6;f++) tot+=c[f]; if(!tot) return 0;
  int b=-1;
  // suites
  if(c[1]&&c[2]&&c[3]&&c[4]&&c[5]&&c[6]){ for(int f=1;f<=6;f++)c[f]--; int r=best(c); if(r>=0&&r+30>b)b=r+30; for(int f=1;f<=6;f++)c[f]++; }
  if(c[1]&&c[2]&&c[3]&&c[4]&&c[5]){ for(int f=1;f<=5;f++)c[f]--; int r=best(c); if(r>=0&&r+10>b)b=r+10; for(int f=1;f<=5;f++)c[f]++; }
  if(c[2]&&c[3]&&c[4]&&c[5]&&c[6]){ for(int f=2;f<=6;f++)c[f]--; int r=best(c); if(r>=0&&r+15>b)b=r+15; for(int f=2;f<=6;f++)c[f]++; }
  for(int f=1;f<=6;f++) for(int m=3;m<=c[f];m++){ int base=(f==1?20:f*2), mult=(m==3?1:m==4?2:m==5?4:8);
    c[f]-=m; int r=best(c); if(r>=0&&r+base*mult>b)b=r+base*mult; c[f]+=m; }
  if(c[1]){ c[1]--; int r=best(c); if(r>=0&&r+2>b)b=r+2; c[1]++; }
  if(c[5]){ c[5]--; int r=best(c); if(r>=0&&r+1>b)b=r+1; c[5]++; }
  return b;
}
static double fact(int n){ double r=1; for(int i=2;i<=n;i++) r*=i; return r; }
static void gen(int n,int f,int left,int *c){
  if(f==6){ c[6]=left; double p=fact(n); for(int g=1;g<=6;g++) p/=fact(c[g]); p/=pow(6,n);
    Roll *r=&R[n][NR[n]++]; r->p=p; r->no=0; int bu[7]; for(int u=0;u<=6;u++) bu[u]=-1;
    int s[7]; // sous-multiensembles
    for(s[1]=0;s[1]<=c[1];s[1]++)for(s[2]=0;s[2]<=c[2];s[2]++)for(s[3]=0;s[3]<=c[3];s[3]++)for(s[4]=0;s[4]<=c[4];s[4]++)for(s[5]=0;s[5]<=c[5];s[5]++)for(s[6]=0;s[6]<=c[6];s[6]++){
      int u=s[1]+s[2]+s[3]+s[4]+s[5]+s[6]; if(!u) continue; int t[7]; memcpy(t,s,sizeof t); int b=best(t); if(b>bu[u]) bu[u]=b; }
    for(int u=1;u<=n;u++) if(bu[u]>0){ // dominance : garder plus de dés n'aide que si plus de points
      int dom=0; for(int v=1;v<u;v++) if(bu[v]>=bu[u]) dom=1; // même points avec moins de dés gardés… on garde quand même (hot dice possible)
      (void)dom; r->o[r->no].pts=bu[u]; r->o[r->no].used=u; r->no++; }
    return; }
  for(int k=0;k<=left;k++){ c[f]=k; gen(n,f+1,left-k,c); }
}
static float *B; // B[i*G+j] = P(i,j,0,6)
#define BI(i,j) B[(i)*G+(j)]
static double T[2][G+1][7]; // table de la paire en cours : T[s][k][n]
static double tableFor(int i,int j,double farkleOpp, double out[G+1][7]){
  // farkleOpp = P(j,i,0,6) supposé. renvoie P(i,j,0,6).
  for(int k=G-i; k>=0; k--){
    for(int n=1;n<=6;n++){
      if(k==0 && n!=6){ out[k][n]=0; continue; }
      double roll=0;
      for(int r=0;r<NR[n];r++){ Roll *x=&R[n][r]; if(!x->no){ roll+=x->p*(1-farkleOpp); continue; }
        double bv=0; for(int o=0;o<x->no;o++){ int k2=k+x->o[o].pts; double v;
          if(i+k2>=G) v=1; else { int n2=n-x->o[o].used; if(!n2) n2=6; v=out[k2][n2]; }
          if(v>bv) bv=v; }
        roll+=x->p*bv; }
      double bank = k>0 ? 1-BI(j,i+k) : 0;
      out[k][n] = bank>roll? bank: roll;
    }
  }
  return out[0][6];
}
int main(){
  int c[7]; for(int n=1;n<=6;n++){ NR[n]=0; gen(n,1,n,c); }
  B=calloc(G*G,sizeof(float));
  for(int s=2*(G-1); s>=0; s--){
    for(int i=G-1;i>=0;i--){ int j=s-i; if(j<0||j>=G||j<i) continue;
      double a=0.5,b=0.5;
      for(int it=0; it<200; it++){
        double a2=tableFor(i,j,b,T[0]); double b2= (i==j)? a2 : tableFor(j,i,a2,T[1]);
        if(i==j){ if(fabs(a2-a)<1e-10){a=a2;b=a2;break;} a=a2;b=a2; continue; }
        if(fabs(a2-a)<1e-10 && fabs(b2-b)<1e-10){a=a2;b=b2;break;} a=a2;b=b2; }
      BI(i,j)=a; BI(j,i)=b;
    }
  }
  FILE *f=fopen("base.bin","wb"); fwrite(B,sizeof(float),G*G,f); fclose(f);
  printf("P(0,0) premier joueur = %.4f\n", BI(0,0));
  // seuils à 0-0 : plus petit k où encaisser >= relancer
  double fo=BI(0,0); tableFor(0,0,fo,T[0]);
  for(int n=1;n<=6;n++){ int th=-1; for(int k=1;k<G;k++){ double roll; // recompute roll value
      roll=0; for(int r=0;r<NR[n];r++){ Roll *x=&R[n][r]; if(!x->no){ roll+=x->p*(1-fo); continue;} double bv=0; for(int o=0;o<x->no;o++){int k2=k+x->o[o].pts; double v; if(k2>=G) v=1; else {int n2=n-x->o[o].used; if(!n2)n2=6; v=T[0][k2][n2];} if(v>bv)bv=v;} roll+=x->p*bv; }
      double bank=1-BI(0,k); if(bank>=roll){ th=k*50; break; } }
    printf("n=%d seuil a 0-0 : %d\n", n, th); }
  return 0;
}
