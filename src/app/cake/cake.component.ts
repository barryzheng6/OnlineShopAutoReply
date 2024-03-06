import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { Cake } from '../../cake';
import { Comment } from '../../comment';

const GET_CAKE_WITH_COMMENTS = gql`
  query GetCakeWithComments($cakeId: ObjectId) {
    cake(query:{ _id: $cakeId }) {
      name
      description
      image
      ingredients
    }

    comments(query: { cakeId: { _id: $cakeId } }, limit: 15, sortBy: DATE_ASC) {
      name,
      date,
      text
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddComment($comment: CommentInsertInput!) {
    insertOneComment(data: $comment) {
      name
      text
      date
    }
  }
`;

// const LOAD_COMMENTS_OFFSET = gql`
//   query LoadCommentsWithOffset($input: CommentsOffsetInput!) {
//     CommentsOffset(input: $input) {
//       name,
//       text,
//       date
//     }
//   }
// `;

@Component({
  selector: 'app-cake',
  templateUrl: './cake.component.html',
  styleUrls: ['./cake.component.css']
})
export class CakeComponent implements OnInit {
  private id: string;
  cakeAndComments$: Observable<{ cake: Cake, comments: Comment[] }>;
  cake: Cake;
  comments: Comment[];
  cakeLoading = true;
  commentsLoading = false;


  constructor(
    private route: ActivatedRoute,
    private apollo: Apollo
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.id = params['id'];

      this.apollo
        .watchQuery({
          query: GET_CAKE_WITH_COMMENTS,
          variables: {
            cakeId: this.id
          }
        })
        .valueChanges
        .subscribe({
          next: (result: any) => {
            this.cakeLoading = result?.loading;
            this.cake = result?.data?.cake;
            this.comments = result?.data?.comments;
            console.dir(result.data);
          }
        });
    });
  }

  addComment(comment: Comment) {
    comment.cakeId = {
      link: this.id
    };

    this.apollo.mutate({
      mutation: ADD_COMMENT,
      variables: { comment }
    })
    .subscribe((result: any) => {
      if (result?.data?.insertOneComment) {
        this.comments = [...this.comments, result?.data?.insertOneComment];



        let onecomment:Comment= {
          cakeId : comment.cakeId,
          name: "AIReply",
          date: new Date("2024-03-04 18:33:23"),
          text: "Thank you for your feedback on the sweetness of our chocolate cake. We appreciate your input and will definitely take it into consideration for future improvements. Did you know that the history of chocolate cake dates back to 1764 when Dr. James Baker discovered how to make chocolate? It can be made with various ingredients like fudge, vanilla creme, and other sweeteners. We will work on finding the perfect balance to ensure everyone can enjoy our delicious chocolate cake. Thank you for bringing this to our attention!"
        }

        setTimeout(() => {
          console.log('sleep');
          this.comments.push(onecomment);
          // And any other code that should run only after 5s
        }, 1000);

      }
    });
  }

  // loadMoreComments() {
  //   this.commentsLoading = true;

  //   const input = {
  //     cake_id: this.id,
  //     offset: this.comments.length,
  //     limit: 5,
  //     sortBy: "date",
  //     sortOrder: "DESC"
  //   }

  //   this.apollo.query({
  //     query: LOAD_COMMENTS_OFFSET,
  //     variables: { input }
  //   })
  //   .subscribe((result: any) => {
  //     this.commentsLoading = result?.data?.loading;
  //     if (result?.data?.CommentsOffset) {
  //       this.comments = [...this.comments, ...result?.data?.CommentsOffset];
  //     }
  //   });
  // }
}
